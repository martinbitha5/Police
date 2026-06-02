-- ─────────────────────────────────────────────────────────────
-- Supabase Realtime — le dashboard superviseur écoute ces tables.
-- ─────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.passengers;
alter publication supabase_realtime add table public.baggage;
alter publication supabase_realtime add table public.fraud_alerts;

-- REPLICA IDENTITY FULL : expose les anciennes valeurs (UPDATE/DELETE)
-- nécessaires côté client pour les filtres et le diff Realtime.
alter table public.passengers   replica identity full;
alter table public.baggage      replica identity full;
alter table public.fraud_alerts replica identity full;
