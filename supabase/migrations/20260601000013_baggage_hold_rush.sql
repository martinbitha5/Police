-- Étapes physiques du bagage après confirmation au tapis :
--  • in_hold : bagage chargé en soute pour la destination (fonction « Charger »).
--  • rush    : bagage restant marqué pour réacheminement sur le prochain vol.
-- is_confirmed reste la confirmation au tapis (anti-fraude) — inchangé.

alter table public.baggage
  add column if not exists in_hold     boolean     not null default false,
  add column if not exists in_hold_at  timestamptz,
  add column if not exists in_hold_by  uuid references public.profiles(id),
  add column if not exists rush        boolean     not null default false,
  add column if not exists rush_at     timestamptz,
  add column if not exists rush_by     uuid references public.profiles(id);

create index if not exists baggage_in_hold_idx on public.baggage (flight_id) where in_hold = true;
create index if not exists baggage_rush_idx    on public.baggage (flight_id) where rush = true;
