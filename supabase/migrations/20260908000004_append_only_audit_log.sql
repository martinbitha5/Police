-- F-01 / F-10 / R-13 : journal d'audit inaltérable (A.8.15, A.8.16).
-- Table append-only alimentée par triggers AFTER. Aucun rôle exposé (anon,
-- authenticated, service_role) ne peut y écrire ni la modifier : seules les
-- fonctions trigger (SECURITY DEFINER, propriété postgres) y insèrent. Lecture
-- réservée à admin/supervisor.
-- Appliqué en production le 2026-09-07 (schema_migrations 20260907230900).

create table if not exists public.audit_log (
  id          bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor       uuid,
  table_name  text not null,
  op          text not null,
  row_id      text,
  before      jsonb,
  after       jsonb
);

create index if not exists audit_log_table_time_idx on public.audit_log (table_name, occurred_at desc);
create index if not exists audit_log_row_idx on public.audit_log (row_id);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_read on public.audit_log;
create policy audit_log_read on public.audit_log
  for select to authenticated
  using (public.auth_role() in ('admin', 'supervisor'));

revoke insert, update, delete, truncate on public.audit_log from anon, authenticated, service_role;
grant select on public.audit_log to authenticated;

create or replace function public.audit_capture()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare rid text;
begin
  rid := coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id'));
  insert into public.audit_log (actor, table_name, op, row_id, before, after)
  values (
    auth.uid(),
    tg_table_name,
    tg_op,
    rid,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;
revoke execute on function public.audit_capture() from public, anon, authenticated;

drop trigger if exists audit_fraud_alerts on public.fraud_alerts;
create trigger audit_fraud_alerts
  after insert or update or delete on public.fraud_alerts
  for each row execute function public.audit_capture();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.audit_capture();

drop trigger if exists audit_baggage_ins on public.baggage;
create trigger audit_baggage_ins
  after insert or delete on public.baggage
  for each row execute function public.audit_capture();

drop trigger if exists audit_baggage_upd on public.baggage;
create trigger audit_baggage_upd
  after update on public.baggage
  for each row
  when (
    old.is_confirmed is distinct from new.is_confirmed
    or old.cancelled is distinct from new.cancelled
    or old.scanned_by is distinct from new.scanned_by
    or old.rush_status is distinct from new.rush_status
    or old.tag_number is distinct from new.tag_number
  )
  execute function public.audit_capture();

drop trigger if exists audit_passengers_ins on public.passengers;
create trigger audit_passengers_ins
  after insert or delete on public.passengers
  for each row execute function public.audit_capture();

drop trigger if exists audit_passengers_upd on public.passengers;
create trigger audit_passengers_upd
  after update on public.passengers
  for each row
  when (
    old.offloaded is distinct from new.offloaded
    or old.boarded is distinct from new.boarded
    or old.declared_baggage_count is distinct from new.declared_baggage_count
    or old.scanned_by is distinct from new.scanned_by
  )
  execute function public.audit_capture();
