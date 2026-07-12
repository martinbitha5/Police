/**
 * Limiteur de débit en mémoire (fenêtre fixe), par process Node.
 *
 * Les endpoints publics (`/api/track`, `/api/claim`) prennent en entrée un PNR
 * ou un numéro d'étiquette et touchent la base. Sans garde-fou, ils sont
 * exposés à l'abus : énumération de PNR pour moissonner des noms/itinéraires,
 * ou spam de réclamations. Ce limiteur plafonne le nombre de requêtes par IP
 * et par fenêtre. Suffisant pour un déploiement mono-process (Hostinger) ;
 * si le service passe à plusieurs instances, chacune appliquera sa propre
 * limite (à remplacer alors par un store partagé type Redis).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000; // garde-fou mémoire : purge si trop d'IP distinctes

/** Retourne `true` si la requête est autorisée, `false` si la limite est atteinte. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > MAX_KEYS) buckets.clear();

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Extrait l'IP client depuis les en-têtes du proxy (Hostinger / CDN). */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
