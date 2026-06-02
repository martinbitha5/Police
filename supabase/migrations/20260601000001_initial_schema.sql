-- ─────────────────────────────────────────────────────────────
-- Schéma initial — Boarding Pass Scanner / anti-fraude bagages
-- ─────────────────────────────────────────────────────────────

-- Profils utilisateurs (agents, superviseurs, admins)
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  role        text not null check (role in ('admin', 'supervisor', 'agent')),
  gate        text,
  created_at  timestamptz not null default now()
);

-- Codes compagnies aériennes (071 = ET = Ethiopian / Air Congo)
create table public.airline_codes (
  numeric_code text primary key,
  iata_code    text,
  name         text
);

-- Vols du jour
create table public.flights (
  id             uuid primary key default gen_random_uuid(),
  flight_number  text not null,
  origin         text not null,
  destination    text not null,
  departure_time timestamptz,
  arrival_time   timestamptz,
  status         text not null default 'scheduled' check (status in ('scheduled', 'boarding', 'closed')),
  date           date not null,
  created_at     timestamptz not null default now()
);

create index flights_date_idx on public.flights (date);

-- Passagers enregistrés (depuis scan boarding pass)
create table public.passengers (
  id                     uuid primary key default gen_random_uuid(),
  flight_id              uuid not null references public.flights (id) on delete cascade,
  full_name              text not null,
  pnr                    text not null,
  seat                   text,
  class                  text,
  sequence_number        int,
  declared_baggage_count int not null default 0,  -- source de vérité anti-fraude
  raw_bcbp               text,
  scanned_at             timestamptz not null default now(),
  scanned_by             uuid references public.profiles (id),
  -- Un PNR est une réservation partagée (famille = même PNR). L'identité d'un
  -- passager dans un vol est donc PNR + siège, pas le PNR seul.
  unique (flight_id, pnr, seat)
);

create index passengers_flight_idx on public.passengers (flight_id);

-- Legs (escales par passager)
create table public.passenger_legs (
  id            uuid primary key default gen_random_uuid(),
  passenger_id  uuid not null references public.passengers (id) on delete cascade,
  origin        text not null,
  destination   text not null,
  flight_number text,
  leg_order     int not null
);

create index passenger_legs_passenger_idx on public.passenger_legs (passenger_id);

-- Bagages
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
-- Clé de liaison anti-fraude : serial_number + flight_id
create index baggage_serial_flight_idx on public.baggage (serial_number, flight_id);

-- Alertes fraude
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
