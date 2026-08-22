-- Pré-annonce d'un bagage expédition rush.
--
-- Le superviseur sait souvent qu'un colis expédié arrive (message d'Air Congo,
-- telex, appel) AVANT qu'il se présente au scan. Il le saisit depuis la page
-- Bagages : numéro de l'étiquette RUSH, provenance, propriétaire. La ligne est
-- créée en rush_status = 'expected' : ce n'est pas encore un bagage physique,
-- c'est une permission donnée en avance.
--
-- Quand l'agent scanne l'étiquette au PDA, l'API retrouve l'annonce et la
-- complète : la ligne passe à 'approved' d'office (l'annonce vaut validation),
-- avec l'heure et l'agent du scan. Un colis non annoncé suit le circuit
-- existant : 'pending' puis décision du superviseur.
--
-- Une annonce annulée passe à 'denied' (jamais de suppression, l'historique
-- reste) ; une annonce jamais présentée reste visible en 'expected' et sort
-- dans les rapports comme telle.

alter table public.baggage
  drop constraint if exists baggage_rush_status_check;
alter table public.baggage
  add constraint baggage_rush_status_check
  check (rush_status in ('expected', 'pending', 'approved', 'denied'));

alter table public.baggage
  add column if not exists announced_at timestamptz,
  add column if not exists announced_by uuid references public.profiles(id),
  -- « Coordonnées » du colis, saisies par le superviseur : la base ne sait
  -- rien d'un bagage venu d'un autre réseau, c'est le seul endroit où ça vit.
  add column if not exists rush_origin text,
  add column if not exists rush_owner_name text,
  add column if not exists rush_note text;

-- ── Vue flight_stats : une annonce n'est pas un bagage physique ─────────────
-- rush_forward_count ne compte que les colis réellement passés au scan
-- (pending/approved) ; les annoncés en attente d'arrivée ont leur compteur.
create or replace view public.flight_stats as
select
  f.id,
  f.flight_number,
  f.origin,
  f.destination,
  f.stops,
  f.airline_code,
  f.departure_time,
  f.arrival_time,
  f.status,
  f.date,
  (select count(*) from public.passengers p
    where p.flight_id = f.id and not p.offloaded)                     as pax_count,
  (select count(*) from public.passengers p
    where p.flight_id = f.id and p.boarded and not p.offloaded)       as boarded_count,
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.kind = 'passenger'
      and not b.cancelled)                                            as bag_declared,
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.kind = 'passenger'
      and b.is_confirmed and not b.cancelled)                         as bag_confirmed,
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.kind = 'passenger'
      and b.in_hold and not b.cancelled)                              as bag_in_hold,
  (select count(*) from public.fraud_alerts a
    where a.flight_id = f.id and not a.resolved)                      as alerts_open,
  (select count(*) from public.baggage_disputes d
    where d.flight_id = f.id)                                         as disputes_count,
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.kind = 'rush_forward'
      and b.rush_status in ('pending', 'approved'))                   as rush_forward_count,
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.kind = 'rush_forward'
      and b.rush_status = 'pending')                                  as rush_pending_count,
  (select count(*) from public.passengers p
    where p.flight_id = f.id and p.offloaded)                         as offloaded_count,
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.cancelled)                         as bag_cancelled,
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.kind = 'rush_forward'
      and b.rush_status = 'expected')                                 as rush_expected_count
from public.flights f;

-- ── Journal d'audit : l'annonce est un mouvement à part entière ─────────────
-- La branche baggage_rush_in exclut désormais les annonces pas encore
-- arrivées ; le mouvement rush_announced porte l'annonce elle-même.
create or replace view public.movement_log
with (security_invoker = true) as
with mv as (
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

  union all
  select p.offloaded_at, 'passenger_offloaded', p.offloaded_by,
         p.flight_id, p.id, null, null, p.offload_reason
  from public.passengers p
  where p.offloaded and p.offloaded_at is not null

  union all
  select b.scanned_at, 'baggage_belt', b.scanned_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  where b.kind = 'passenger' and b.is_confirmed and b.scanned_at is not null

  union all
  select b.scanned_at, 'baggage_declared', p.scanned_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  join public.passengers p on p.id = b.passenger_id
  where b.kind = 'passenger' and not b.is_confirmed and b.scanned_at is not null

  union all
  select b.announced_at, 'rush_announced', b.announced_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number,
         coalesce(b.rush_origin, 'Annonce superviseur')
  from public.baggage b
  where b.kind = 'rush_forward' and b.announced_at is not null

  union all
  select b.scanned_at, 'baggage_rush_in', b.scanned_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number,
         case when b.announced_at is not null then 'Bagage annoncé, arrivé au scan'
              when b.passenger_id is not null then 'Restant connu réacheminé'
              else 'Bagage externe (validation superviseur)' end
  from public.baggage b
  where b.kind = 'rush_forward' and b.rush_status <> 'expected'
    and b.scanned_by is not null and b.scanned_at is not null

  union all
  select b.rush_status_at,
         case b.rush_status when 'approved' then 'rush_approved' else 'rush_denied' end,
         b.rush_status_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  where b.kind = 'rush_forward' and b.rush_status in ('approved', 'denied')
    and b.rush_status_at is not null and b.rush_status_by is not null

  union all
  select b.cancelled_at, 'baggage_cancelled', b.cancelled_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, b.cancel_reason
  from public.baggage b
  where b.cancelled and b.cancelled_at is not null

  union all
  select b.pulled_at, 'baggage_pulled', b.pulled_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number, null
  from public.baggage b
  where b.pulled and b.pulled_at is not null

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

  union all
  select a.created_at, 'fraud_opened', null::uuid,
         a.flight_id, null, null, a.tag_number, a.reason
  from public.fraud_alerts a

  union all
  select a.resolved_at, 'fraud_resolved', a.resolved_by,
         a.flight_id, null, null, a.tag_number, a.reason
  from public.fraud_alerts a
  where a.resolved and a.resolved_at is not null

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
