-- Fusion des passagers en double (même vol, même billet électronique).
--
-- Contexte : jusqu'au 17/09/2026, un boarding pass réédité par Sabre après un
-- changement de siège créait une deuxième ligne `passengers` (clé d'unicité
-- flight_id + pnr + siège). Depuis, l'API reconnaît le passager par son billet
-- (colonne ticket_number, remplie rétroactivement le 17/09) et met la ligne à
-- jour. Ce script fusionne l'historique : 185 groupes, 187 lignes en trop,
-- entre le 11/08 et le 17/09/2026.
--
-- Règle de fusion, par groupe (flight_id, ticket_number) :
--   - on GARDE la ligne la plus ancienne (celle qui porte les bagages
--     pré-enregistrés et confirmés au tapis) ;
--   - elle reçoit le siège, la classe, la séquence et le BCBP brut de la
--     ligne la plus récente (le dernier boarding pass fait foi) ;
--   - bagages déclarés = le maximum du groupe (une réédition sans étiquettes
--     disait 0 alors que le bagage était déjà passé) ;
--   - embarqué = vrai si l'une des lignes l'était, avec son horodatage ;
--   - bagages et litiges des lignes supprimées sont rattachés à la ligne gardée ;
--   - les legs des lignes supprimées disparaissent avec elles (cascade), la
--     ligne gardée a les siens ;
--   - l'état « débarqué » de la ligne gardée est conservé tel quel : un
--     superviseur qui a débarqué la ligne fantôme n'a pas débarqué le passager.
--
-- Deux voyageurs d'une même réservation portant le même nom mais deux billets
-- (ET70 du 14/09) ne sont PAS fusionnés : ce sont deux passagers.
--
-- À exécuter en une transaction. Le journal d'audit trace chaque suppression.

begin;

-- Instantané des groupes avant toute modification.
create temp table dup_groups on commit drop as
select flight_id, ticket_number
from public.passengers
where ticket_number is not null
group by flight_id, ticket_number
having count(*) > 1;

create temp table dup_rows on commit drop as
select p.id, p.flight_id, p.ticket_number, p.seat, p.class, p.sequence_number, p.raw_bcbp,
       p.declared_baggage_count, p.boarded, p.boarded_at, p.boarded_by, p.scanned_at,
       row_number() over (partition by p.flight_id, p.ticket_number order by p.scanned_at asc)  as rn_oldest,
       row_number() over (partition by p.flight_id, p.ticket_number order by p.scanned_at desc) as rn_newest
from public.passengers p
join dup_groups g using (flight_id, ticket_number);

create temp table keep on commit drop as
select k.id as keep_id, k.flight_id, k.ticket_number,
       n.seat, n.class, n.sequence_number, n.raw_bcbp,
       (select max(declared_baggage_count) from dup_rows d where d.flight_id = k.flight_id and d.ticket_number = k.ticket_number) as declared,
       (select bool_or(boarded) from dup_rows d where d.flight_id = k.flight_id and d.ticket_number = k.ticket_number) as boarded,
       (select min(boarded_at) from dup_rows d where d.flight_id = k.flight_id and d.ticket_number = k.ticket_number and d.boarded) as boarded_at,
       (select boarded_by from dup_rows d where d.flight_id = k.flight_id and d.ticket_number = k.ticket_number and d.boarded order by boarded_at limit 1) as boarded_by
from dup_rows k
join dup_rows n on n.flight_id = k.flight_id and n.ticket_number = k.ticket_number and n.rn_newest = 1
where k.rn_oldest = 1;

-- 1. Rattacher bagages et litiges des lignes en trop à la ligne gardée.
update public.baggage b
set passenger_id = k.keep_id
from dup_rows d
join keep k on k.flight_id = d.flight_id and k.ticket_number = d.ticket_number
where b.passenger_id = d.id and d.rn_oldest > 1;

update public.baggage_disputes bd
set passenger_id = k.keep_id
from dup_rows d
join keep k on k.flight_id = d.flight_id and k.ticket_number = d.ticket_number
where bd.passenger_id = d.id and d.rn_oldest > 1;

-- 2. Supprimer les lignes en trop (legs en cascade). Avant la mise à jour du
--    siège, pour libérer la clé (flight_id, pnr, seat).
delete from public.passengers p
using dup_rows d
where p.id = d.id and d.rn_oldest > 1;

-- 3. Porter le dernier boarding pass sur la ligne gardée.
update public.passengers p
set seat = k.seat,
    class = k.class,
    sequence_number = k.sequence_number,
    raw_bcbp = k.raw_bcbp,
    declared_baggage_count = greatest(p.declared_baggage_count, k.declared),
    boarded = p.boarded or k.boarded,
    boarded_at = coalesce(p.boarded_at, k.boarded_at),
    boarded_by = coalesce(p.boarded_by, k.boarded_by)
from keep k
where p.id = k.keep_id;

-- 4. Contrôle : plus aucun groupe en double.
do $$
declare n int;
begin
  select count(*) into n
  from (select 1 from public.passengers where ticket_number is not null
        group by flight_id, ticket_number having count(*) > 1) x;
  if n > 0 then
    raise exception 'Il reste % groupe(s) en double, fusion annulée', n;
  end if;
end $$;

-- 5. Verrou définitif : un billet par vol.
create unique index if not exists passengers_flight_ticket_key
  on public.passengers (flight_id, ticket_number)
  where ticket_number is not null;

commit;
