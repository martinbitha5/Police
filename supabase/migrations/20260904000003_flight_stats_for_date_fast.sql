-- Compteurs des cartes vol du mobile : 8 secondes ramenées à quelques
-- millisecondes.
--
-- La version précédente agrégeait TOUTE la table passengers et TOUTE la table
-- baggage (group by flight_id) avant de ne garder que les vols de la journée.
-- Sous `security invoker`, la policy de lecture appelle `flight_in_scope()`
-- pour chaque ligne parcourue : plus de trente mille appels par exécution,
-- huit secondes, soit exactement le délai où PostgREST coupe. Chaque ouverture
-- de l'application attendait ce délai, puis retombait sur le comptage vol par
-- vol.
--
-- Ici on part des vols du jour et on ne parcourt que leurs lignes : la policy
-- ne s'évalue plus que sur quelques centaines de lignes. Mêmes colonnes, mêmes
-- exclusions (passagers hors débarqués, bagages passagers hors annulés), même
-- sécurité (invoker, RLS appliquée).

create or replace function public.flight_stats_for_date(d date)
returns table (
  flight_id uuid,
  pax       bigint,
  bag_total bigint,
  bag_ok    bigint,
  boarded   bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with day as (
    select f.id from public.flights f where f.date = d
  ),
  pax as (
    select p.flight_id,
           count(*)                          as n,
           count(*) filter (where p.boarded) as brd
    from public.passengers p
    join day on day.id = p.flight_id
    where not p.offloaded
    group by p.flight_id
  ),
  bag as (
    select b.flight_id,
           count(*)                               as n,
           count(*) filter (where b.is_confirmed) as ok
    from public.baggage b
    join day on day.id = b.flight_id
    where b.kind = 'passenger' and not b.cancelled
    group by b.flight_id
  )
  select day.id,
         coalesce(pax.n, 0),
         coalesce(bag.n, 0),
         coalesce(bag.ok, 0),
         coalesce(pax.brd, 0)
  from day
  left join pax on pax.flight_id = day.id
  left join bag on bag.flight_id = day.id;
$$;

revoke execute on function public.flight_stats_for_date(date) from public, anon;
grant  execute on function public.flight_stats_for_date(date) to authenticated;
