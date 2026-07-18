-- Dolly : poste de contrôle rayon X avant chargement.
-- L'agent scanne chaque bagage qui sort du rayon X ; seuls les bagages déjà
-- enregistrés au tapis (is_confirmed = true, liés à un passager) sont acceptés
-- sur le dolly et tractés vers l'avion. Garantit qu'on ne charge que du bagage sûr.
--
-- Étape physique distincte de in_hold (chargé en soute) : le dolly est le
-- chariot qui amène les bagages contrôlés jusqu'à l'appareil.

alter table public.baggage
  add column if not exists on_dolly    boolean     not null default false,
  add column if not exists on_dolly_at timestamptz,
  add column if not exists on_dolly_by uuid references public.profiles(id);

create index if not exists baggage_on_dolly_idx on public.baggage (flight_id) where on_dolly = true;
