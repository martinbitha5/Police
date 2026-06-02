-- ─────────────────────────────────────────────────────────────
-- Escales intermédiaires d'un vol (vols avec transit).
-- Route complète = origin → stops[1..n] → destination.
-- Ex. FIH → FKI → FBM  ⇒  origin=FIH, stops={FKI}, destination=FBM.
-- ─────────────────────────────────────────────────────────────

alter table public.flights
  add column stops text[] not null default '{}';
