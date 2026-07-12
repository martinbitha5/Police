import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client service_role — SERVEUR UNIQUEMENT (route handlers).
 * Le suivi bagage est public (passager non authentifié) ; la RLS réserve la
 * lecture aux comptes authentifiés, on la contourne donc côté serveur en ne
 * renvoyant que des champs filtrés. Ne jamais importer dans un composant client.
 *
 * Réutilisé entre requêtes (singleton) : le client passe par l'API REST HTTP de
 * Supabase, sans connexion PostgreSQL persistante — inutile d'en recréer un à
 * chaque appel.
 */
let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  return cached;
}
