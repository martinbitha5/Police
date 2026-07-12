import { NextResponse, type NextRequest } from 'next/server';
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

interface CacheEntry {
  at: number;
  flights: PublicFlight[];
}

// Persistent entre requêtes (module-level) pour la durée de vie du process Node.
const cache = new Map<string, CacheEntry>();
// Déduplication : les requêtes concurrentes pendant un « cache miss » partagent
// la même requête Supabase au lieu d'en déclencher chacune une (thundering herd).
const inFlight = new Map<string, Promise<PublicFlight[]>>();

/** Date du jour au format YYYY-MM-DD (fuseau local serveur). */
function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
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
      cache.set(date, { at: Date.now(), flights });
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
