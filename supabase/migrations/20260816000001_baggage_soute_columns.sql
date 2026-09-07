-- ─────────────────────────────────────────────────────────────
-- F-14 / I-04 : réintégration de l'ancien fichier racine `migration_soute.sql`
-- (« à exécuter une fois dans le SQL Editor ») dans la chaîne versionnée.
--
-- Colonnes du compartiment soute sur baggage. Placé AVANT 20260817000001
-- (movement_log) et les vues de stats qui lisent ces colonnes : sans cette
-- migration, `supabase db reset` échouait.
--
-- Idempotent (IF NOT EXISTS) : no-op sur la base de production.
-- ─────────────────────────────────────────────────────────────

alter table public.baggage
  add column if not exists soute    text        check (soute in ('avant', 'arriere')),
  add column if not exists soute_at timestamptz,
  add column if not exists soute_by uuid        references public.profiles (id);
