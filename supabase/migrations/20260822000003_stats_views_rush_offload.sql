-- Compteurs et journal d'audit mis à jour pour l'expédition rush et le
-- débarquement / annulation.
--
-- Principe des compteurs : les ratios de réconciliation restent PURS — bagages
-- passagers uniquement, hors annulés ; passagers hors débarqués. L'expédition
-- rush est comptée à part, jamais mélangée aux ratios.

-- ── 1. Vue flight_stats (dashboard web, écrans Vols / Rapports) ─────────────
-- Colonnes existantes conservées dans le même ordre (create or replace view
-- l'exige) ; les nouvelles sont ajoutées en fin.
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
  -- Nouveaux compteurs (ajoutés en fin de vue).
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.kind = 'rush_forward'
      and b.rush_status <> 'denied')                                  as rush_forward_count,
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.kind = 'rush_forward'
      and b.rush_status = 'pending')                                  as rush_pending_count,
  (select count(*) from public.passengers p
    where p.flight_id = f.id and p.offloaded)                         as offloaded_count,
  (select count(*) from public.baggage b
    where b.flight_id = f.id and b.cancelled)                         as bag_cancelled
from public.flights f;

-- ── 2. RPC flight_stats_for_date (compteurs des cartes vol du mobile) ───────
-- Mêmes exclusions : bagages passagers hors annulés, passagers hors débarqués.
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
  with pax as (
    select flight_id,
           count(*)                        as n,
           count(*) filter (where boarded) as brd
    from public.passengers
    where not offloaded
    group by flight_id
  ),
  bag as (
    select flight_id,
           count(*)                             as n,
           count(*) filter (where is_confirmed) as ok
    from public.baggage
    where kind = 'passenger' and not cancelled
    group by flight_id
  )
  select f.id,
         coalesce(pax.n, 0),
         coalesce(bag.n, 0),
         coalesce(bag.ok, 0),
         coalesce(pax.brd, 0)
  from public.flights f
  left join pax on pax.flight_id = f.id
  left join bag on bag.flight_id = f.id
  where f.date = d;
$$;

revoke execute on function public.flight_stats_for_date(date) from public, anon;
grant  execute on function public.flight_stats_for_date(date) to authenticated;

-- ── 3. Journal d'audit movement_log ─────────────────────────────────────────
-- Nouveaux mouvements : enregistrement d'une expédition rush, décision du
-- superviseur, débarquement, annulation, retrait de soute. Les branches
-- baggage_belt / baggage_declared se limitent désormais aux bagages passagers :
-- un rush_forward n'est ni « déclaré au check-in » ni « enregistré au tapis ».
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

  -- Expédition rush : enregistrement d'un bagage sans passager sur le vol.
  union all
  select b.scanned_at, 'baggage_rush_in', b.scanned_by,
         b.flight_id, b.passenger_id, b.id, b.tag_number,
         case when b.passenger_id is not null then 'Restant connu réacheminé'
              else 'Bagage externe (validation superviseur)' end
  from public.baggage b
  where b.kind = 'rush_forward' and b.scanned_at is not null

  -- Décision du superviseur sur un rush externe (l'approbation automatique
  -- d'un restant connu n'a pas d'auteur et n'apparaît pas ici).
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
