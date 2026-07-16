import { NextResponse, type NextRequest } from 'next/server';
import { formatRoute, flightNumbersMatch } from '@police/shared';
import type {
  BaggageTrackingResult,
  TrackedPassenger,
  TrackedBag,
  BaggageStatus,
  Flight,
  FlightStatus,
  DisputeStatus,
} from '@police/shared';
import { createAdminClient } from '@/supabase/admin';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const TAG_RE = /^\d{10}$/;
const NOT_FOUND = (message: string): BaggageTrackingResult => ({ status: 'not_found', message });

const BAG_COLUMNS = 'id, tag_number, is_confirmed, in_hold, in_hold_at, rush, scanned_at, passenger_id, flight_id';

interface BagRow {
  id: string;
  tag_number: string;
  is_confirmed: boolean;
  in_hold: boolean;
  in_hold_at: string | null;
  rush: boolean;
  scanned_at: string | null;
  passenger_id: string;
  flight_id: string;
}

/** Dérive le statut affiché au passager (du plus avancé au moins avancé). */
function bagStatus(b: BagRow): BaggageStatus {
  if (b.rush) return 'rush';
  if (b.in_hold) return 'loaded';
  if (b.is_confirmed) return 'registered';
  return 'pending';
}

interface DisputeStatusRow {
  baggage_id: string | null;
  status: DisputeStatus;
}

interface PaxRow {
  id: string;
  full_name: string;
  pnr: string;
  flight_id: string;
  declared_baggage_count: number;
}

interface LegRow {
  passenger_id: string;
  origin: string;
  destination: string;
  leg_order: number;
}

export async function POST(request: NextRequest) {
  // Anti-abus : plafonne les recherches par IP (énumération de PNR).
  if (!rateLimit(`track:${clientIp(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: 'Trop de recherches en peu de temps. Réessayez dans un instant.' },
      { status: 429 },
    );
  }

  let body: { query?: unknown; flightNumber?: unknown; date?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  const flightFilter = typeof body.flightNumber === 'string' ? body.flightNumber.trim() : '';
  const dateFilter = typeof body.date === 'string' ? body.date.trim() : '';
  if (!query) {
    return NextResponse.json({ error: 'Numéro d’étiquette ou PNR requis' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ── Récupère les lignes baggage selon le mode de recherche ──────────────
  let bagRows: BagRow[];
  if (TAG_RE.test(query)) {
    // Mode étiquette : 10 chiffres → tag_number exact.
    const { data, error } = await supabase
      .from('baggage')
      .select(BAG_COLUMNS)
      .eq('tag_number', query)
      .order('scanned_at', { ascending: false })
      .limit(1);
    if (error) return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
    bagRows = (data as BagRow[] | null) ?? [];
    if (bagRows.length === 0) {
      return NextResponse.json<BaggageTrackingResult>(
        NOT_FOUND('Aucun bagage trouvé pour ce numéro d’étiquette.'),
      );
    }
  } else {
    // Mode PNR : on retrouve d’abord les passagers, puis leurs bagages.
    const pnr = query.toUpperCase();
    const { data: paxByPnr, error: paxErr } = await supabase
      .from('passengers')
      .select('id')
      .eq('pnr', pnr);
    if (paxErr) return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
    const ids = ((paxByPnr as { id: string }[] | null) ?? []).map((p) => p.id);
    if (ids.length === 0) {
      return NextResponse.json<BaggageTrackingResult>(
        NOT_FOUND('Aucune réservation trouvée pour ce PNR.'),
      );
    }
    const { data, error } = await supabase
      .from('baggage')
      .select(BAG_COLUMNS)
      .in('passenger_id', ids);
    if (error) return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
    bagRows = (data as BagRow[] | null) ?? [];
    if (bagRows.length === 0) {
      return NextResponse.json<BaggageTrackingResult>(
        NOT_FOUND('Réservation trouvée, mais aucun bagage enregistré pour le moment.'),
      );
    }
  }

  // ── Charge passagers + vols + escales + litiges en une passe ────────────
  const paxIds = [...new Set(bagRows.map((b) => b.passenger_id))];
  const flightIds = [...new Set(bagRows.map((b) => b.flight_id))];
  const bagIds = [...new Set(bagRows.map((b) => b.id))];

  const [{ data: paxData }, { data: flightData }, { data: legData }, { data: disputeData }] =
    await Promise.all([
      supabase
        .from('passengers')
        .select('id, full_name, pnr, flight_id, declared_baggage_count')
        .in('id', paxIds),
      supabase.from('flights').select('*').in('id', flightIds),
      supabase
        .from('passenger_legs')
        .select('passenger_id, origin, destination, leg_order')
        .in('passenger_id', paxIds)
        .order('leg_order'),
      supabase
        .from('baggage_disputes')
        .select('baggage_id, status')
        .in('baggage_id', bagIds)
        .order('created_at', { ascending: false }),
    ]);

  // Statut de réclamation par bagage (le plus récent l'emporte : on garde la
  // première occurrence, la requête étant triée du plus récent au plus ancien).
  const claimByBagId = new Map<string, DisputeStatus>();
  for (const d of (disputeData as DisputeStatusRow[] | null) ?? []) {
    if (d.baggage_id && !claimByBagId.has(d.baggage_id)) {
      claimByBagId.set(d.baggage_id, d.status);
    }
  }

  const paxById = new Map((paxData as PaxRow[] | null ?? []).map((p) => [p.id, p]));
  const flightById = new Map((flightData as Flight[] | null ?? []).map((f) => [f.id, f]));

  const legsByPax = new Map<string, LegRow[]>();
  for (const l of (legData as LegRow[] | null) ?? []) {
    const arr = legsByPax.get(l.passenger_id) ?? [];
    arr.push(l);
    legsByPax.set(l.passenger_id, arr);
  }

  function routeFor(pax: PaxRow): string {
    const legs = legsByPax.get(pax.id);
    if (legs && legs.length > 0) {
      const ordered = [...legs].sort((a, b) => a.leg_order - b.leg_order);
      return [ordered[0]!.origin, ...ordered.map((l) => l.destination)].join(' → ');
    }
    const flight = flightById.get(pax.flight_id);
    return flight ? formatRoute(flight) : 'N/A';
  }

  // ── Regroupe les bagages par passager ───────────────────────────────────
  const bagsByPax = new Map<string, BagRow[]>();
  for (const b of bagRows) {
    const arr = bagsByPax.get(b.passenger_id) ?? [];
    arr.push(b);
    bagsByPax.set(b.passenger_id, arr);
  }

  const passengers: TrackedPassenger[] = [];
  for (const [pid, bags] of bagsByPax) {
    const pax = paxById.get(pid);
    if (!pax) continue;
    const flight = flightById.get(pax.flight_id);
    const trackedBags: TrackedBag[] = bags
      .sort((a, b) => a.tag_number.localeCompare(b.tag_number))
      .map((b) => {
        const status = bagStatus(b);
        return {
          tagNumber: b.tag_number,
          status,
          scannedAt: status === 'loaded' ? (b.in_hold_at ?? b.scanned_at) : status === 'pending' ? null : b.scanned_at,
          claimStatus: claimByBagId.get(b.id) ?? null,
        };
      });
    passengers.push({
      passengerName: pax.full_name,
      pnr: pax.pnr,
      flightNumber: flight?.flight_number ?? 'N/A',
      route: routeFor(pax),
      flightDate: flight?.date ?? 'N/A',
      flightStatus: (flight?.status ?? 'scheduled') as FlightStatus,
      departureTime: flight?.departure_time ?? null,
      declaredBaggageCount: pax.declared_baggage_count,
      // « confirmés » = bagages au moins enregistrés (scannés au tapis).
      confirmedBaggageCount: trackedBags.filter((b) => b.status !== 'pending').length,
      bags: trackedBags,
    });
  }

  // Filtres optionnels (numéro de vol, date de départ) saisis par le passager.
  let filtered = passengers;
  if (flightFilter) {
    filtered = filtered.filter((p) => flightNumbersMatch(p.flightNumber, flightFilter));
  }
  if (dateFilter) {
    filtered = filtered.filter((p) => p.flightDate === dateFilter);
  }

  if (filtered.length === 0) {
    return NextResponse.json<BaggageTrackingResult>(
      NOT_FOUND('Aucun bagage ne correspond aux critères saisis.'),
    );
  }

  return NextResponse.json<BaggageTrackingResult>({ status: 'found', passengers: filtered });
}
