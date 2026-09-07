-- ─────────────────────────────────────────────────────────────
-- Correctifs sécurité critiques C-01, C-02, C-03 (audit 2026-09-07)
--
-- C-01 : l'écriture directe PostgREST par le rôle agent contourne l'anti-fraude.
-- C-03 : les policies d'écriture n'ont jamais reçu le périmètre par compagnie
--        (seule la lecture l'a eu en 2026-07). Écritures inter-tenant aveugles.
-- C-02 : un non-admin peut réattribuer sa propre compagnie/aéroport.
--
-- Principe : l'écriture opérationnelle passe par l'API (service_role, qui
-- ignore la RLS et n'est donc PAS affectée par cette migration). Le mobile
-- n'écrit jamais en direct ces tables (uniquement profiles.full_name + mot de
-- passe). On peut donc, sans impact fonctionnel :
--   • retirer le droit d'écriture directe au rôle 'agent' ;
--   • exiger flight_in_scope() sur toute écriture directe superviseur/admin
--     (le dashboard web écrit en direct, toujours dans son périmètre).
-- ─────────────────────────────────────────────────────────────

-- ── C-02 : figer les colonnes de périmètre pour tout non-admin ──
-- On conserve « <> 'admin' » (et non « is distinct from ») : pour le
-- service_role auth_role() vaut NULL, la condition est NULL, le bloc est ignoré
-- et le backend garde tous ses droits. Un agent/superviseur voit en revanche
-- ses colonnes de périmètre figées à leur ancienne valeur.
create or replace function public.lock_protected_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_role() <> 'admin' then
    new.id           := old.id;
    new.role         := old.role;
    new.staff_code   := old.staff_code;
    new.airline_code := old.airline_code;  -- ajout C-02
    new.airport_code := old.airport_code;  -- ajout C-02
    new.gate         := old.gate;          -- ajout C-02
  end if;
  return new;
end;
$$;

-- ── C-01 + C-03 : écriture directe = superviseur/admin, dans le périmètre ──

-- baggage
drop policy if exists baggage_agent_write  on public.baggage;
drop policy if exists baggage_agent_update on public.baggage;

create policy baggage_write_scoped on public.baggage
  for insert to authenticated
  with check (public.auth_role() in ('admin','supervisor') and public.flight_in_scope(flight_id));

create policy baggage_update_scoped on public.baggage
  for update to authenticated
  using      (public.auth_role() in ('admin','supervisor') and public.flight_in_scope(flight_id))
  with check (public.auth_role() in ('admin','supervisor') and public.flight_in_scope(flight_id));

-- passengers
drop policy if exists passengers_agent_insert      on public.passengers;
drop policy if exists passengers_supervisor_update on public.passengers;

create policy passengers_insert_scoped on public.passengers
  for insert to authenticated
  with check (public.auth_role() in ('admin','supervisor') and public.flight_in_scope(flight_id));

create policy passengers_update_scoped on public.passengers
  for update to authenticated
  using      (public.auth_role() in ('admin','supervisor') and public.flight_in_scope(flight_id))
  with check (public.auth_role() in ('admin','supervisor') and public.flight_in_scope(flight_id));

-- passenger_legs (périmètre via le vol du passager, comme la policy de lecture)
drop policy if exists passenger_legs_agent_insert on public.passenger_legs;

create policy passenger_legs_insert_scoped on public.passenger_legs
  for insert to authenticated
  with check (
    public.auth_role() in ('admin','supervisor')
    and exists (
      select 1 from public.passengers p
      where p.id = passenger_id and public.flight_in_scope(p.flight_id)
    )
  );

-- fraud_alerts
drop policy if exists fraud_alerts_insert  on public.fraud_alerts;
drop policy if exists fraud_alerts_resolve on public.fraud_alerts;

create policy fraud_alerts_insert_scoped on public.fraud_alerts
  for insert to authenticated
  with check (public.auth_role() in ('admin','supervisor') and public.flight_in_scope(flight_id));

create policy fraud_alerts_resolve_scoped on public.fraud_alerts
  for update to authenticated
  using      (public.auth_role() in ('admin','supervisor') and public.flight_in_scope(flight_id))
  with check (public.auth_role() in ('admin','supervisor') and public.flight_in_scope(flight_id));
