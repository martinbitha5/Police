-- ═══════════════════════════════════════════════════════════════
-- BOOTSTRAP — Boarding Pass Scanner / anti-fraude bagages
-- À coller dans Supabase Dashboard → SQL Editor → Run.
-- Concatène les 4 migrations + le seed dans l'ordre.
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. Schéma initial
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  role        text not null check (role in ('admin', 'supervisor', 'agent')),
  gate        text,
  created_at  timestamptz not null default now()
);

create table public.airline_codes (
  numeric_code text primary key,
  iata_code    text,
  name         text
);

create table public.flights (
  id             uuid primary key default gen_random_uuid(),
  flight_number  text not null,
  origin         text not null,
  destination    text not null,
  stops          text[] not null default '{}',  -- escales : route = origin → stops → destination
  departure_time timestamptz,
  arrival_time   timestamptz,
  status         text not null default 'scheduled' check (status in ('scheduled', 'boarding', 'closed')),
  date           date not null,
  created_at     timestamptz not null default now()
);

create index flights_date_idx on public.flights (date);

create table public.passengers (
  id                     uuid primary key default gen_random_uuid(),
  flight_id              uuid not null references public.flights (id) on delete cascade,
  full_name              text not null,
  pnr                    text not null,
  seat                   text,
  class                  text,
  sequence_number        int,
  declared_baggage_count int not null default 0,
  raw_bcbp               text,
  scanned_at             timestamptz not null default now(),
  scanned_by             uuid references public.profiles (id),
  -- Un PNR est une réservation partagée (famille = même PNR). L'identité d'un
  -- passager dans un vol est donc PNR + siège, pas le PNR seul.
  unique (flight_id, pnr, seat)
);

create index passengers_flight_idx on public.passengers (flight_id);

create table public.passenger_legs (
  id            uuid primary key default gen_random_uuid(),
  passenger_id  uuid not null references public.passengers (id) on delete cascade,
  origin        text not null,
  destination   text not null,
  flight_number text,
  leg_order     int not null
);

create index passenger_legs_passenger_idx on public.passenger_legs (passenger_id);

create table public.baggage (
  id                   uuid primary key default gen_random_uuid(),
  passenger_id         uuid not null references public.passengers (id) on delete cascade,
  flight_id            uuid not null references public.flights (id) on delete cascade,
  tag_number           text not null unique,
  issuer_code          text,
  airline_numeric_code text,
  serial_number        text,
  is_confirmed         boolean not null default false,
  scanned_at           timestamptz not null default now(),
  scanned_by           uuid references public.profiles (id)
);

create index baggage_flight_idx on public.baggage (flight_id);
create index baggage_passenger_idx on public.baggage (passenger_id);
create index baggage_serial_flight_idx on public.baggage (serial_number, flight_id);

create table public.fraud_alerts (
  id                     uuid primary key default gen_random_uuid(),
  flight_id              uuid not null references public.flights (id) on delete cascade,
  pnr                    text,
  passenger_name         text,
  tag_number             text,
  declared_baggage_count int,
  gate                   text,
  reason                 text not null,
  resolved               boolean not null default false,
  created_at             timestamptz not null default now()
);

create index fraud_alerts_flight_idx on public.fraud_alerts (flight_id);
create index fraud_alerts_unresolved_idx on public.fraud_alerts (flight_id) where resolved = false;


-- ─────────────────────────────────────────────────────────────
-- 2. Trigger : création du profil à l'inscription
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, gate)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'agent'),
    new.raw_user_meta_data ->> 'gate'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────────────────────

create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles       enable row level security;
alter table public.airline_codes  enable row level security;
alter table public.flights        enable row level security;
alter table public.passengers     enable row level security;
alter table public.passenger_legs enable row level security;
alter table public.baggage        enable row level security;
alter table public.fraud_alerts   enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.auth_role() in ('admin', 'supervisor'));

create policy profiles_admin_write on public.profiles
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

create policy airline_codes_read on public.airline_codes
  for select to authenticated using (true);

create policy airline_codes_admin_write on public.airline_codes
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

create policy flights_read on public.flights
  for select to authenticated using (true);

create policy flights_manage on public.flights
  for all to authenticated
  using (public.auth_role() in ('admin', 'supervisor'))
  with check (public.auth_role() in ('admin', 'supervisor'));

create policy passengers_read on public.passengers
  for select to authenticated using (true);

create policy passengers_agent_insert on public.passengers
  for insert to authenticated
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

create policy passenger_legs_read on public.passenger_legs
  for select to authenticated using (true);

create policy passenger_legs_agent_insert on public.passenger_legs
  for insert to authenticated
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

create policy baggage_read on public.baggage
  for select to authenticated using (true);

create policy baggage_agent_write on public.baggage
  for insert to authenticated
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

create policy baggage_agent_update on public.baggage
  for update to authenticated
  using (public.auth_role() in ('admin', 'supervisor', 'agent'))
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

create policy fraud_alerts_read on public.fraud_alerts
  for select to authenticated
  using (public.auth_role() in ('admin', 'supervisor'));

create policy fraud_alerts_insert on public.fraud_alerts
  for insert to authenticated
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

create policy fraud_alerts_resolve on public.fraud_alerts
  for update to authenticated
  using (public.auth_role() in ('admin', 'supervisor'))
  with check (public.auth_role() in ('admin', 'supervisor'));


-- ─────────────────────────────────────────────────────────────
-- 4. Realtime (ré-exécutable : n'ajoute que si absent)
-- ─────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'passengers'
  ) then
    alter publication supabase_realtime add table public.passengers;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'baggage'
  ) then
    alter publication supabase_realtime add table public.baggage;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fraud_alerts'
  ) then
    alter publication supabase_realtime add table public.fraud_alerts;
  end if;
end $$;

alter table public.passengers   replica identity full;
alter table public.baggage      replica identity full;
alter table public.fraud_alerts replica identity full;


-- ─────────────────────────────────────────────────────────────
-- 5. Seed — codes compagnies
-- ─────────────────────────────────────────────────────────────

insert into public.airline_codes (numeric_code, iata_code, name) values
  ('071', 'ET', 'Ethiopian / Air Congo')
on conflict (numeric_code) do nothing;
