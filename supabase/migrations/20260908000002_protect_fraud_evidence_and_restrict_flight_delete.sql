-- E-05 (audit 2026-09-07) : empêcher la destruction des preuves de fraude et
-- réserver la suppression de vol aux admins.
-- Appliqué en production le 2026-09-07 (schema_migrations 20260907182006).

-- E-05a : les alertes fraude ne sont plus effacées en cascade avec le vol.
alter table public.fraud_alerts drop constraint fraud_alerts_flight_id_fkey;
alter table public.fraud_alerts
  add constraint fraud_alerts_flight_id_fkey
  foreign key (flight_id) references public.flights (id) on delete restrict;

-- E-05b : découper flights_manage (FOR ALL) par opération. Suppression = admin.
drop policy if exists flights_manage on public.flights;

create policy flights_insert on public.flights
  for insert to authenticated
  with check (
    public.auth_role() in ('admin','supervisor')
    and airline_code = public.auth_airline()
    and (origin = public.auth_airport() or destination = public.auth_airport())
  );

create policy flights_update on public.flights
  for update to authenticated
  using (
    public.auth_role() in ('admin','supervisor')
    and airline_code = public.auth_airline()
    and (origin = public.auth_airport() or destination = public.auth_airport())
  )
  with check (
    public.auth_role() in ('admin','supervisor')
    and airline_code = public.auth_airline()
    and (origin = public.auth_airport() or destination = public.auth_airport())
  );

create policy flights_delete on public.flights
  for delete to authenticated
  using (
    public.auth_role() = 'admin'
    and airline_code = public.auth_airline()
    and (origin = public.auth_airport() or destination = public.auth_airport())
  );
