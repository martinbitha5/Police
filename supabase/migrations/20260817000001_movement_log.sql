-- Journal d'audit : chaque mouvement du système, une ligne par mouvement.
--
-- Aucune écriture n'est ajoutée. Toutes les étapes portent déjà leur horodatage
-- et leur auteur (scanned_at/by, boarded_at/by, on_dolly_at/by, soute_at/by,
-- in_hold_at/by, rush_at/by, arrived_at/by, resolved_at/by). La vue se contente
-- de les déplier. Deux conséquences voulues :
--   • l'historique est consultable rétroactivement, dès la première ouverture,
--     sans attendre que des triggers se remplissent ;
--   • le chemin de scan des agents n'écrit pas une ligne de plus, donc les PDA
--     sur le terrain ne ralentissent pas.
--
-- Réservée aux admins. Le filtre `auth_role() = 'admin'` est posé DANS la vue,
-- et pas seulement dans l'interface : un superviseur qui interrogerait l'API
-- directement obtient zéro ligne. `security_invoker` conserve par ailleurs la
-- RLS des tables sources, donc un admin ne voit que les vols de son aéroport et
-- de sa compagnie, comme partout ailleurs.
--
-- Limite connue, assumée : quand un bagage pré-enregistré au check-in est
-- confirmé au tapis, l'API écrase `scanned_at` avec l'heure du scan. L'heure de
-- pré-enregistrement est donc perdue pour les bagages confirmés, et le journal
-- montre un seul mouvement pour eux (`baggage_belt`) au lieu de deux.

create or replace view public.movement_log
with (security_invoker = true) as
with mv as (
  -- Passagers
  select p.scanned_at as at, 'passenger_checkin'::text as kind, p.scanned_by as actor_id,
         p.flight_id, p.id as passenger_id, null::uuid as baggage_id,
         null::text as tag_number, null::text as detail
  from public.passengers p
  where p.scanned_at is not null

  union all
  select p.boarded_at, 'passenger_boarded', p.boarded_by,
         p.flight_id, p.id, null, null, null
  from public.passengers p
  where p.boarded and p.boarded_at is not null

  -- Bagages : une ligne par étape franchie
  union all
  select b.scanned_at, 'baggage_belt', b.scanned_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  where b.is_confirmed and b.scanned_at is not null

  -- Bagage encore non scanné au tapis : `scanned_at` porte l'heure du
  -- pré-enregistrement, et l'auteur est l'agent qui a fait le check-in.
  union all
  select b.scanned_at, 'baggage_declared', p.scanned_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  join public.passengers p on p.id = b.passenger_id
  where not b.is_confirmed and b.scanned_at is not null

  union all
  select b.on_dolly_at, 'baggage_dolly', b.on_dolly_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  where b.on_dolly and b.on_dolly_at is not null

  union all
  select b.soute_at, 'baggage_soute', b.soute_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, b.soute
  from public.baggage b
  where b.soute is not null and b.soute_at is not null

  union all
  select b.in_hold_at, 'baggage_hold', b.in_hold_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  where b.in_hold and b.in_hold_at is not null

  union all
  select b.rush_at, 'baggage_rush', b.rush_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  where b.rush and b.rush_at is not null

  union all
  select b.arrived_at, 'baggage_arrived', b.arrived_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  where b.arrived and b.arrived_at is not null

  -- Alertes fraude. `fraud_alerts` ne porte pas de `created_by` : l'alerte est
  -- levée par les règles anti-fraude, pas par un agent. L'auteur reste nul.
  union all
  select a.created_at, 'fraud_opened', null::uuid,
         a.flight_id, null, null, a.tag_number, a.reason
  from public.fraud_alerts a

  union all
  select a.resolved_at, 'fraud_resolved', a.resolved_by,
         a.flight_id, null, null, a.tag_number, a.reason
  from public.fraud_alerts a
  where a.resolved and a.resolved_at is not null

  -- Litiges bagages
  union all
  select d.created_at, 'dispute_opened', d.created_by,
         d.flight_id, d.passenger_id, d.baggage_id, d.tag_number, d.reason
  from public.baggage_disputes d

  union all
  select d.resolved_at, 'dispute_resolved', d.resolved_by,
         d.flight_id, d.passenger_id, d.baggage_id, d.tag_number, d.status
  from public.baggage_disputes d
  where d.resolved_at is not null
)
select
  mv.at,
  mv.kind,
  mv.actor_id,
  pr.full_name    as actor_name,
  pr.role         as actor_role,
  mv.flight_id,
  f.flight_number,
  f.date          as flight_date,
  f.origin,
  f.destination,
  mv.passenger_id,
  p.full_name     as passenger_name,
  p.pnr,
  mv.baggage_id,
  mv.tag_number,
  mv.detail
from mv
left join public.flights    f  on f.id  = mv.flight_id
left join public.passengers p  on p.id  = mv.passenger_id
left join public.profiles   pr on pr.id = mv.actor_id
where public.auth_role() = 'admin';

revoke all on public.movement_log from public, anon;
grant select on public.movement_log to authenticated;
