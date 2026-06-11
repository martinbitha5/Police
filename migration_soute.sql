-- ═══════════════════════════════════════════════════════════════════
-- Migration : Soute — compartiment de chargement bagage
-- À exécuter UNE SEULE FOIS dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.baggage
  ADD COLUMN IF NOT EXISTS soute        TEXT        CHECK (soute IN ('avant', 'arriere')),
  ADD COLUMN IF NOT EXISTS soute_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS soute_by     UUID        REFERENCES public.profiles(id);
