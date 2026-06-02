import { createClient } from '@supabase/supabase-js';

/**
 * Client service_role — SERVEUR UNIQUEMENT (route handlers).
 * Le suivi bagage est public (passager non authentifié) ; la RLS réserve la
 * lecture aux comptes authentifiés, on la contourne donc côté serveur en ne
 * renvoyant que des champs filtrés. Ne jamais importer dans un composant client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
