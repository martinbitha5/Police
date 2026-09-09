-- Maintien du journal activity_log à jour, par déclencheurs AFTER sur les tables
-- opérationnelles. Reproduit les mêmes transitions que la vue movement_log.
-- Appliqué en production le 2026-09-08.

create or replace function public.activity_add(
  p_at timestamptz, p_kind text, p_actor uuid, p_flight uuid,
  p_passenger uuid, p_baggage uuid, p_tag text, p_detail text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_at is null then return; end if;
  insert into public.activity_log (at, kind, actor_id, flight_id, flight_date, passenger_id, baggage_id, tag_number, detail)
  values (p_at, p_kind, p_actor, p_flight,
          (select date from public.flights where id = p_flight),
          p_passenger, p_baggage, p_tag, p_detail);
end $$;
revoke execute on function public.activity_add(timestamptz,text,uuid,uuid,uuid,uuid,text,text) from public, anon, authenticated;

create or replace function public.activity_passengers() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.scanned_at is not null then
      perform activity_add(new.scanned_at, 'passenger_checkin', new.scanned_by, new.flight_id, new.id, null, null, null);
    end if;
  else
    if new.boarded and new.boarded_at is not null and (old.boarded is distinct from new.boarded) then
      perform activity_add(new.boarded_at, 'passenger_boarded', new.boarded_by, new.flight_id, new.id, null, null, null);
    end if;
    if new.offloaded and new.offloaded_at is not null and (old.offloaded is distinct from new.offloaded) then
      perform activity_add(new.offloaded_at, 'passenger_offloaded', new.offloaded_by, new.flight_id, new.id, null, null, new.offload_reason);
    end if;
  end if;
  return null;
end $$;
revoke execute on function public.activity_passengers() from public, anon, authenticated;

create or replace function public.activity_baggage() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.kind = 'passenger' and not new.is_confirmed and new.scanned_at is not null then
      perform activity_add(new.scanned_at, 'baggage_declared',
        (select scanned_by from public.passengers where id = new.passenger_id),
        new.flight_id, new.passenger_id, new.id, new.tag_number, null);
    end if;
    if new.kind = 'rush_forward' and new.announced_at is not null then
      perform activity_add(new.announced_at, 'rush_announced', new.announced_by, new.flight_id, new.passenger_id, new.id, new.tag_number, coalesce(new.rush_origin, 'Annonce superviseur'));
    end if;
    if new.kind = 'rush_forward' and new.rush_status <> 'expected' and new.scanned_by is not null and new.scanned_at is not null then
      perform activity_add(new.scanned_at, 'baggage_rush_in', new.scanned_by, new.flight_id, new.passenger_id, new.id, new.tag_number,
        case when new.announced_at is not null then 'Bagage annoncé, arrivé au scan'
             when new.passenger_id is not null then 'Restant connu réacheminé'
             else 'Bagage externe (validation superviseur)' end);
    end if;
    return null;
  end if;

  if new.kind = 'passenger' and new.is_confirmed and new.scanned_at is not null and (old.is_confirmed is distinct from new.is_confirmed) then
    perform activity_add(new.scanned_at, 'baggage_belt', new.scanned_by, new.flight_id, new.passenger_id, new.id, new.tag_number, null);
  end if;
  if new.kind = 'rush_forward' and new.announced_at is not null and (old.announced_at is distinct from new.announced_at) then
    perform activity_add(new.announced_at, 'rush_announced', new.announced_by, new.flight_id, new.passenger_id, new.id, new.tag_number, coalesce(new.rush_origin, 'Annonce superviseur'));
  end if;
  if new.kind = 'rush_forward' and new.rush_status <> 'expected' and new.scanned_by is not null and new.scanned_at is not null
     and (old.scanned_by is distinct from new.scanned_by or old.rush_status is distinct from new.rush_status) then
    perform activity_add(new.scanned_at, 'baggage_rush_in', new.scanned_by, new.flight_id, new.passenger_id, new.id, new.tag_number,
      case when new.announced_at is not null then 'Bagage annoncé, arrivé au scan'
           when new.passenger_id is not null then 'Restant connu réacheminé'
           else 'Bagage externe (validation superviseur)' end);
  end if;
  if new.kind = 'rush_forward' and new.rush_status in ('approved','denied') and new.rush_status_at is not null and new.rush_status_by is not null
     and (old.rush_status is distinct from new.rush_status) then
    perform activity_add(new.rush_status_at, case new.rush_status when 'approved' then 'rush_approved' else 'rush_denied' end,
      new.rush_status_by, new.flight_id, new.passenger_id, new.id, new.tag_number, null);
  end if;
  if new.cancelled and new.cancelled_at is not null and (old.cancelled is distinct from new.cancelled) then
    perform activity_add(new.cancelled_at, 'baggage_cancelled', new.cancelled_by, new.flight_id, new.passenger_id, new.id, new.tag_number, new.cancel_reason);
  end if;
  if new.pulled and new.pulled_at is not null and (old.pulled is distinct from new.pulled) then
    perform activity_add(new.pulled_at, 'baggage_pulled', new.pulled_by, new.flight_id, new.passenger_id, new.id, new.tag_number, null);
  end if;
  if new.on_dolly and new.on_dolly_at is not null and (old.on_dolly is distinct from new.on_dolly) then
    perform activity_add(new.on_dolly_at, 'baggage_dolly', new.on_dolly_by, new.flight_id, new.passenger_id, new.id, new.tag_number, null);
  end if;
  if new.soute is not null and new.soute_at is not null and (old.soute is distinct from new.soute) then
    perform activity_add(new.soute_at, 'baggage_soute', new.soute_by, new.flight_id, new.passenger_id, new.id, new.tag_number, new.soute);
  end if;
  if new.in_hold and new.in_hold_at is not null and (old.in_hold is distinct from new.in_hold) then
    perform activity_add(new.in_hold_at, 'baggage_hold', new.in_hold_by, new.flight_id, new.passenger_id, new.id, new.tag_number, null);
  end if;
  if new.rush and new.rush_at is not null and (old.rush is distinct from new.rush) then
    perform activity_add(new.rush_at, 'baggage_rush', new.rush_by, new.flight_id, new.passenger_id, new.id, new.tag_number, null);
  end if;
  if new.arrived and new.arrived_at is not null and (old.arrived is distinct from new.arrived) then
    perform activity_add(new.arrived_at, 'baggage_arrived', new.arrived_by, new.flight_id, new.passenger_id, new.id, new.tag_number, null);
  end if;
  return null;
end $$;
revoke execute on function public.activity_baggage() from public, anon, authenticated;

create or replace function public.activity_fraud() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform activity_add(new.created_at, 'fraud_opened', null, new.flight_id, null, null, new.tag_number, new.reason);
  else
    if new.resolved and new.resolved_at is not null and (old.resolved is distinct from new.resolved) then
      perform activity_add(new.resolved_at, 'fraud_resolved', new.resolved_by, new.flight_id, null, null, new.tag_number, new.reason);
    end if;
  end if;
  return null;
end $$;
revoke execute on function public.activity_fraud() from public, anon, authenticated;

create or replace function public.activity_dispute() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform activity_add(new.created_at, 'dispute_opened', new.created_by, new.flight_id, new.passenger_id, new.baggage_id, new.tag_number, new.reason);
  else
    if new.resolved_at is not null and (old.resolved_at is distinct from new.resolved_at) then
      perform activity_add(new.resolved_at, 'dispute_resolved', new.resolved_by, new.flight_id, new.passenger_id, new.baggage_id, new.tag_number, new.status);
    end if;
  end if;
  return null;
end $$;
revoke execute on function public.activity_dispute() from public, anon, authenticated;

drop trigger if exists activity_passengers_trg on public.passengers;
create trigger activity_passengers_trg after insert or update on public.passengers for each row execute function public.activity_passengers();

drop trigger if exists activity_baggage_trg on public.baggage;
create trigger activity_baggage_trg after insert or update on public.baggage for each row execute function public.activity_baggage();

drop trigger if exists activity_fraud_trg on public.fraud_alerts;
create trigger activity_fraud_trg after insert or update on public.fraud_alerts for each row execute function public.activity_fraud();

drop trigger if exists activity_dispute_trg on public.baggage_disputes;
create trigger activity_dispute_trg after insert or update on public.baggage_disputes for each row execute function public.activity_dispute();
