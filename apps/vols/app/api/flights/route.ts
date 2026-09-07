import { NextResponse, type NextRequest } from 'next/server';
import { todayAtAirport } from '@police/shared';
import { createAdminClient } from '@/supabase/admin';
import type { PublicFlight } from '@/types';

const HUB = process.env.NEXT_PUBLIC_HUB ?? 'FIH';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Cache serveur court. Le tableau des vols d'une date est identique pour tous les
 * visiteurs : sans cache, chaque navigateur qui interroge l'API toutes les 30 s
 * déclenche une requête Supabase distincte, et la charge grimpe linéairement avec
 * le nombre de visiteurs. Ce cache mémoire ramène le tout à ~1 requête Supabase
 * par date et par TTL, quel que soit le nombre de visiteurs simultanés.
 */
const CACHE_TTL_MS = 20_000;
// F-05 : borne du nombre d'entrées. La date est choisie par l'appelant ; sans
// éviction, itérer sur des dates distinctes fait croître la map indéfiniment.
const CACHE_MAX_ENTRIES = 500;

interface CacheEntry {
  at: number;
  flights: PublicFlight[];
}

// Persistent entre requêtes (module-level) pour la durée de vie du process Node.
const cache = new Map<string, CacheEntry>();
// Déduplication : les requêtes concurrentes pendant un « cache miss » partagent
// la même requête Supabase au lieu d'en déclencher chacune une (thundering herd).
const inFlight = new Map<string, Promise<PublicFlight[]>>();

/**
 * Journée d'exploitation du hub. Surtout pas le fuseau du serveur : déployé, il
 * tourne en UTC et basculerait de jour une heure trop tôt pour Kinshasa.
 */
function todayISO(): string {
  return todayAtAirport(HUB);
}

async function fetchFlights(date: string): Promise<PublicFlight[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('flights')
    .select('flight_number, origin, destination, stops, departure_time, arrival_time, status, date')
    .eq('date', date)
    .order('departure_time', { ascending: true, nullsFirst: false });

  if (error) throw new Error('flights query failed');
  return (data as PublicFlight[] | null) ?? [];
}

async function getFlights(date: string): Promise<PublicFlight[]> {
  const hit = cache.get(date);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.flights;

  const pending = inFlight.get(date);
  if (pending) return pending;

  const p = fetchFlights(date)
    .then((flights) => {
      // F-05 : purge des entrées périmées, puis borne dure sur la taille.
      const now = Date.now();
      for (const [k, v] of cache) if (now - v.at >= CACHE_TTL_MS) cache.delete(k);
      if (cache.size >= CACHE_MAX_ENTRIES) cache.clear();
      cache.set(date, { at: now, flights });
      return flights;
    })
    .finally(() => {
      inFlight.delete(date);
    });

  inFlight.set(date, p);
  return p;
}

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get('date') ?? '';
  const date = DATE_RE.test(dateParam) ? dateParam : todayISO();

  try {
    const flights = await getFlights(date);
    return NextResponse.json(
      { date, hub: HUB, flights },
      // Autorise aussi un éventuel CDN/proxy en amont à absorber la charge.
      { headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40' } },
    );
  } catch {
    return NextResponse.json({ error: 'Erreur de chargement des vols' }, { status: 500 });
  }
}
