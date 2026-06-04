import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/supabase/admin';
import type { PublicFlight } from '@/types';

const HUB = process.env.NEXT_PUBLIC_HUB ?? 'FIH';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Date du jour au format YYYY-MM-DD (fuseau local serveur). */
function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get('date') ?? '';
  const date = DATE_RE.test(dateParam) ? dateParam : todayISO();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('flights')
    .select('flight_number, origin, destination, stops, departure_time, arrival_time, status, date')
    .eq('date', date)
    .order('departure_time', { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: 'Erreur de chargement des vols' }, { status: 500 });
  }

  return NextResponse.json({
    date,
    hub: HUB,
    flights: (data as PublicFlight[] | null) ?? [],
  });
}
