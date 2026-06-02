-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- Rôles : admin (web), supervisor (web), agent (mobile).
-- ─────────────────────────────────────────────────────────────

-- Helper SECURITY DEFINER : lit le rôle sans déclencher la RLS de profiles
-- (évite la récursion infinie sur les policies de la table profiles).
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

-- ── profiles ──────────────────────────────────────────────────
-- Chacun lit son propre profil ; admin/supervisor lisent tout.
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.auth_role() in ('admin', 'supervisor'));

-- Seul l'admin gère les comptes (en plus du trigger d'inscription).
create policy profiles_admin_write on public.profiles
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

-- ── airline_codes ─────────────────────────────────────────────
create policy airline_codes_read on public.airline_codes
  for select to authenticated using (true);

create policy airline_codes_admin_write on public.airline_codes
  for all to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

-- ── flights ───────────────────────────────────────────────────
-- Tout utilisateur authentifié lit les vols ; supervisor/admin les gèrent.
create policy flights_read on public.flights
  for select to authenticated using (true);

create policy flights_manage on public.flights
  for all to authenticated
  using (public.auth_role() in ('admin', 'supervisor'))
  with check (public.auth_role() in ('admin', 'supervisor'));

-- ── passengers ────────────────────────────────────────────────
create policy passengers_read on public.passengers
  for select to authenticated using (true);

-- L'agent crée les passagers au scan du boarding pass.
create policy passengers_agent_insert on public.passengers
  for insert to authenticated
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

-- ── passenger_legs ────────────────────────────────────────────
create policy passenger_legs_read on public.passenger_legs
  for select to authenticated using (true);

create policy passenger_legs_agent_insert on public.passenger_legs
  for insert to authenticated
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

-- ── baggage ───────────────────────────────────────────────────
create policy baggage_read on public.baggage
  for select to authenticated using (true);

create policy baggage_agent_write on public.baggage
  for insert to authenticated
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

create policy baggage_agent_update on public.baggage
  for update to authenticated
  using (public.auth_role() in ('admin', 'supervisor', 'agent'))
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

-- ── fraud_alerts ──────────────────────────────────────────────
-- Lecture réservée au superviseur/admin (le dashboard).
create policy fraud_alerts_read on public.fraud_alerts
  for select to authenticated
  using (public.auth_role() in ('admin', 'supervisor'));

-- L'agent (via l'API) crée l'alerte au moment du rejet bagage.
create policy fraud_alerts_insert on public.fraud_alerts
  for insert to authenticated
  with check (public.auth_role() in ('admin', 'supervisor', 'agent'));

-- Seul superviseur/admin marque résolu.
create policy fraud_alerts_resolve on public.fraud_alerts
  for update to authenticated
  using (public.auth_role() in ('admin', 'supervisor'))
  with check (public.auth_role() in ('admin', 'supervisor'));
