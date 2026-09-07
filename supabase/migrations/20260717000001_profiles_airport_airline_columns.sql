-- ─────────────────────────────────────────────────────────────
-- F-14 / I-04 : réintégration de l'ancien fichier racine
-- `migration_airport_scope.sql` (« à exécuter une fois dans le SQL Editor »)
-- dans la chaîne de migrations versionnée.
--
-- Colonnes de périmètre sur profiles. Placé AVANT 20260718000001, qui insère
-- déjà airport_code / airline_code : sans cette migration, `supabase db reset`
-- échouait (colonnes inexistantes).
--
-- Idempotent (IF NOT EXISTS + COALESCE) : no-op sur la base de production, où
-- ces colonnes existent déjà via l'ancien passage manuel.
--
-- IMPORTANT : la redéfinition de handle_new_user présente dans l'ancien fichier
-- racine est volontairement OMISE ici. Elle était régressive (sans whitelist de
-- rôle ni `set search_path`). La version de référence, durcie, vit dans
-- 20260718000001_security_hardening.sql et les migrations suivantes.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists airport_code text,
  add column if not exists airline_code text default 'ET';

update public.profiles
   set airport_code = coalesce(airport_code, 'FIH'),
       airline_code = coalesce(airline_code, 'ET')
 where airport_code is null or airline_code is null;
