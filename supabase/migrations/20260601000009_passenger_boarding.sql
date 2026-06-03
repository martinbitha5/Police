-- ─────────────────────────────────────────────────────────────
-- Embarquement à la porte : confirmer qu'un passager enregistré
-- est physiquement monté à bord + suivre le reste à embarquer.
-- ─────────────────────────────────────────────────────────────

alter table public.passengers
  add column if not exists boarded     boolean     not null default false,
  add column if not exists boarded_at  timestamptz,
  add column if not exists boarded_by  uuid references public.profiles (id);

-- Compteur "reste à embarquer" = enregistrés non encore embarqués.
create index if not exists passengers_flight_boarded_idx
  on public.passengers (flight_id, boarded);
