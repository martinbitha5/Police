-- Cloisonnement par compagnie aérienne.
--
-- Avant : les lectures étaient ouvertes à tout utilisateur authentifié
-- (using true). Un compte Kenya Airways pouvait lire les vols, passagers,
-- bagages et alertes d'Air Congo en interrogeant l'API directement, même si
-- l'interface les masquait. airline_code existait sur profiles mais n'entrait
-- dans aucun filtre.
--
-- L'API de scan utilise la clé service_role et contourne la RLS : les
-- opérations terrain ne sont pas affectées par ces policies.

-- ── 1. Porter le transporteur sur le vol ──────────────────────
-- Colonne générée depuis le préfixe du numéro de vol : toujours cohérente
-- avec flight_number, sans code applicatif à maintenir ni oubli possible à
-- la création d'un vol.
alter table public.flights
  add column if not exists airline_code text
  generated always as (upper(substring(flight_number from '^[A-Za-z]+'))) stored;

create index if not exists flights_scope_idx
  on public.flights (date, airline_code);

-- ── 2. Périmètre du profil connecté ───────────────────────────
-- SECURITY DEFINER pour lire profiles sans déclencher la récursion de ses
-- propres policies, comme auth_role().
create or replace function public.auth_airport()
returns text language sql stable security definer set search_path = public as $$
  select airport_code from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_airline()
returns text language sql stable security definer set search_path = public as $$
  select airline_code from public.profiles where id = auth.uid();
$$;

-- Un vol appartient-il au périmètre du profil ? SECURITY DEFINER pour lire
-- flights sans dépendre de sa propre policy, ce qui éviterait une récursion.
create or replace function public.flight_in_scope(f_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.flights f
    where f.id = f_id
      and f.airline_code = public.auth_airline()
      and (
        f.origin = public.auth_airport()
        or f.destination = public.auth_airport()
        or public.auth_airport() = any (coalesce(f.stops, '{}'::text[]))
      )
  );
$$;

revoke execute on function public.auth_airport() from public, anon;
revoke execute on function public.auth_airline() from public, anon;
revoke execute on function public.flight_in_scope(uuid) from public, anon;
grant execute on function public.auth_airport() to authenticated;
grant execute on function public.auth_airline() to authenticated;
grant execute on function public.flight_in_scope(uuid) to authenticated;

-- ── 3. Policies de lecture, restreintes au périmètre ──────────
drop policy if exists flights_read on public.flights;
create policy flights_read on public.flights
  for select to authenticated
  using (
    airline_code = public.auth_airline()
    and (
      origin = public.auth_airport()
      or destination = public.auth_airport()
      or public.auth_airport() = any (coalesce(stops, '{}'::text[]))
    )
  );

drop policy if exists flights_manage on public.flights;
create policy flights_manage on public.flights
  for all to authenticated
  using (
    public.auth_role() in ('admin', 'supervisor')
    and airline_code = public.auth_airline()
    and (origin = public.auth_airport() or destination = public.auth_airport())
  )
  with check (
    public.auth_role() in ('admin', 'supervisor')
    and airline_code = public.auth_airline()
    and (origin = public.auth_airport() or destination = public.auth_airport())
  );

drop policy if exists passengers_read on public.passengers;
create policy passengers_read on public.passengers
  for select to authenticated
  using (public.flight_in_scope(flight_id));

drop policy if exists baggage_read on public.baggage;
create policy baggage_read on public.baggage
  for select to authenticated
  using (public.flight_in_scope(flight_id));

drop policy if exists passenger_legs_read on public.passenger_legs;
create policy passenger_legs_read on public.passenger_legs
  for select to authenticated
  using (
    exists (
      select 1 from public.passengers p
      where p.id = passenger_id and public.flight_in_scope(p.flight_id)
    )
  );

drop policy if exists fraud_alerts_read on public.fraud_alerts;
create policy fraud_alerts_read on public.fraud_alerts
  for select to authenticated
  using (
    public.auth_role() in ('admin', 'supervisor')
    and public.flight_in_scope(flight_id)
  );
