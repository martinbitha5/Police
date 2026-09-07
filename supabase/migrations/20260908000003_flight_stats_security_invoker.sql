-- M-09 (audit 2026-09-07) : la vue flight_stats appliquait les droits de son
-- créateur (SECURITY DEFINER), contournant la RLS. On la bascule en
-- security_invoker : elle applique la RLS de l'appelant.
-- Appliqué en production le 2026-09-07 (schema_migrations 20260907185714).
alter view public.flight_stats set (security_invoker = true);
