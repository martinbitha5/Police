-- ═══════════════════════════════════════════════════════════════════
-- Migration : Multi-site — airport_code + airline_code sur profiles
-- À exécuter UNE SEULE FOIS dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Ajouter les deux colonnes à la table profiles
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS airport_code TEXT,
  ADD COLUMN IF NOT EXISTS airline_code TEXT DEFAULT 'ET';

-- ─────────────────────────────────────────────────────────────
-- 2. Backfill : tous les comptes existants → FIH + ET
--    (ajustez manuellement après si certains superviseurs
--     sont déjà affectés à un autre aéroport)
-- ─────────────────────────────────────────────────────────────
UPDATE public.profiles
SET
  airport_code = 'FIH',
  airline_code = 'ET'
WHERE airport_code IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 3. (Optionnel) Mettre à jour un superviseur précis
--    Décommentez et adaptez au besoin
-- ─────────────────────────────────────────────────────────────
-- UPDATE public.profiles
-- SET airport_code = 'FBM', airline_code = 'ET'
-- WHERE id = '<uuid-du-superviseur-fbm>';

-- UPDATE public.profiles
-- SET airport_code = 'FKI', airline_code = 'ET'
-- WHERE id = '<uuid-du-superviseur-fki>';

-- ─────────────────────────────────────────────────────────────
-- Codes aéroports DRC de référence :
--   FIH = Kinshasa N'Djili      FBM = Lubumbashi
--   FKI = Kisangani             BKY = Bukavu
--   GOM = Goma                  KND = Kindu
--   KWZ = Kolwezi               BUX = Bunia
--   MNB = Muanda                MDK = Mbandaka
--   FDU = Bandundu              BDT = Gbadolite
--   IRP = Isiro
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- 4. Mettre à jour le trigger handle_new_user
--    pour que les NOUVEAUX comptes incluent airport_code
--    et airline_code dès la création
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, gate, airport_code, airline_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
    NEW.raw_user_meta_data->>'gate',
    COALESCE(NEW.raw_user_meta_data->>'airport_code', 'FIH'),
    COALESCE(NEW.raw_user_meta_data->>'airline_code', 'ET')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name    = EXCLUDED.full_name,
    role         = EXCLUDED.role,
    gate         = EXCLUDED.gate,
    airport_code = EXCLUDED.airport_code,
    airline_code = EXCLUDED.airline_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le trigger est bien attaché (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 5. (Recommandé) RLS : un superviseur ne voit que les vols
--    de son aéroport. Décommentez si RLS est activé sur flights.
-- ─────────────────────────────────────────────────────────────
-- CREATE POLICY "supervisor_airport_scope" ON public.flights
--   FOR SELECT
--   TO authenticated
--   USING (
--     origin      = (SELECT airport_code FROM public.profiles WHERE id = auth.uid()) OR
--     destination = (SELECT airport_code FROM public.profiles WHERE id = auth.uid())
--   );
