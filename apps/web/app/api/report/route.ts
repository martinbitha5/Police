import { NextResponse, type NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import type { Flight, Passenger, Baggage, FraudAlert, PassengerLeg } from '@police/shared';
import { formatRoute } from '@police/shared';
import { createClient } from '@/supabase/server';

const HUB = process.env.NEXT_PUBLIC_HUB ?? 'FIH';

const COLOR = {
  primary: 'FF2563EB',
  dark: 'FF0F172A',
  header: 'FF1E293B',
  danger: 'FFDC2626',
  light: 'FFF1F5F9',
  zebra: 'FFF8FAFC',
};

export async function GET(request: NextRequest) {
  const flightId = request.nextUrl.searchParams.get('flightId');
  if (!flightId) {
    return NextResponse.json({ error: 'flightId requis' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: flight } = await supabase.from('flights').select('*').eq('id', flightId).single<Flight>();
  if (!flight) {
    return NextResponse.json({ error: 'Vol introuvable' }, { status: 404 });
  }

  const [{ data: pax }, { data: bags }, { data: fraud }] = await Promise.all([
    supabase.from('passengers').select('*').eq('flight_id', flightId).order('full_name'),
    supabase.from('baggage').select('passenger_id, is_confirmed').eq('flight_id', flightId),
    supabase.from('fraud_alerts').select('*').eq('flight_id', flightId).order('created_at'),
  ]);

  const passengers = (pax as Passenger[] | null) ?? [];
  const baggage = (bags as Pick<Baggage, 'passenger_id' | 'is_confirmed'>[] | null) ?? [];
  const alerts = (fraud as FraudAlert[] | null) ?? [];

  // Routes (escales) par passager
  const routeByPax = new Map<string, string>();
  const paxIds = passengers.map((p) => p.id);
  if (paxIds.length > 0) {
    const { data: legsData } = await supabase
      .from('passenger_legs')
      .select('passenger_id, origin, destination, leg_order')
      .in('passenger_id', paxIds)
      .order('leg_order');
    const byPax = new Map<string, PassengerLeg[]>();
    for (const l of (legsData as PassengerLeg[] | null) ?? []) {
      const arr = byPax.get(l.passenger_id) ?? [];
      arr.push(l);
      byPax.set(l.passenger_id, arr);
    }
    for (const [pid, legs] of byPax) {
      const ordered = legs.sort((a, b) => a.leg_order - b.leg_order);
      const first = ordered[0];
      if (first) routeByPax.set(pid, [first.origin, ...ordered.map((l) => l.destination)].join(' → '));
    }
  }

  const confirmedByPax = new Map<string, number>();
  for (const b of baggage) {
    if (b.is_confirmed) confirmedByPax.set(b.passenger_id, (confirmedByPax.get(b.passenger_id) ?? 0) + 1);
  }
  const declaredTotal = passengers.reduce((s, p) => s + p.declared_baggage_count, 0);
  const confirmedTotal = [...confirmedByPax.values()].reduce((s, n) => s + n, 0);

  // Stats globales de la journée
  const { data: dayFlights } = await supabase.from('flights').select('id').eq('date', flight.date);
  const dayIds = ((dayFlights as { id: string }[] | null) ?? []).map((f) => f.id);
  const [{ count: dayPax }, { count: dayBags }, { count: dayFraud }] = await Promise.all([
    supabase.from('passengers').select('*', { count: 'exact', head: true }).in('flight_id', dayIds),
    supabase.from('baggage').select('*', { count: 'exact', head: true }).in('flight_id', dayIds).eq('is_confirmed', true),
    supabase.from('fraud_alerts').select('*', { count: 'exact', head: true }).in('flight_id', dayIds),
  ]);

  // ── Construction du classeur Excel ──────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Boarding Scanner';
  wb.created = new Date();
  const ws = wb.addWorksheet('Rapport', {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 18 },
  });
  ws.columns = [
    { width: 30 },
    { width: 14 },
    { width: 10 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
  ];

  let r = 1;

  function title(text: string) {
    ws.mergeCells(r, 1, r, 6);
    const cell = ws.getCell(r, 1);
    cell.value = text;
    cell.font = { bold: true, size: 16, color: { argb: COLOR.light } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.primary } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(r).height = 30;
    r += 1;
  }

  function meta(label: string, value: string) {
    ws.getCell(r, 1).value = label;
    ws.getCell(r, 1).font = { bold: true, color: { argb: COLOR.header } };
    ws.mergeCells(r, 2, r, 6);
    ws.getCell(r, 2).value = value;
    r += 1;
  }

  function section(text: string) {
    r += 1;
    ws.mergeCells(r, 1, r, 6);
    const cell = ws.getCell(r, 1);
    cell.value = text;
    cell.font = { bold: true, size: 12, color: { argb: COLOR.light } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.dark } };
    cell.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(r).height = 22;
    r += 1;
  }

  function headerRow(cells: string[]) {
    const row = ws.getRow(r);
    cells.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      cell.value = c;
      cell.font = { bold: true, color: { argb: COLOR.light } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.header } };
      cell.border = { bottom: { style: 'thin', color: { argb: COLOR.header } } };
    });
    r += 1;
  }

  function dataRow(cells: (string | number)[], opts?: { danger?: boolean; zebra?: boolean }) {
    const row = ws.getRow(r);
    cells.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      cell.value = c;
      if (opts?.danger) {
        cell.font = { color: { argb: COLOR.danger } };
      } else if (opts?.zebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.zebra } };
      }
    });
    r += 1;
  }

  // 1. En-tête
  title(`Rapport de vol — ${flight.flight_number}`);
  meta('Vol', `${flight.flight_number}  (${formatRoute(flight)})`);
  meta('Date', flight.date);
  meta('Aéroport (hub)', HUB);
  meta('Statut', flight.status);
  meta('Édité le', new Date().toLocaleString('fr-FR'));

  // 2. Liste passagers
  section('Passagers');
  headerRow(['Passager', 'PNR', 'Siège', 'Classe', 'Route', 'Bagages (conf./décl.)']);
  if (passengers.length === 0) {
    dataRow(['Aucun passager enregistré', '', '', '', '', '']);
  } else {
    passengers.forEach((p, i) => {
      const conf = confirmedByPax.get(p.id) ?? 0;
      dataRow(
        [
          p.full_name,
          p.pnr,
          p.seat ?? '—',
          p.class ?? '—',
          routeByPax.get(p.id) ?? formatRoute(flight),
          `${conf} / ${p.declared_baggage_count}`,
        ],
        { zebra: i % 2 === 1 },
      );
    });
  }

  // 3. Résumé bagages
  section('Résumé bagages');
  dataRow(['Total bagages déclarés', declaredTotal]);
  dataRow(['Total bagages confirmés', confirmedTotal]);
  dataRow(['Écart (déclarés - confirmés)', declaredTotal - confirmedTotal], { danger: declaredTotal - confirmedTotal !== 0 });

  // 4. Alertes fraude
  section('Alertes fraude');
  headerRow(['Heure', 'Passager', 'PNR', 'Étiquette', 'Raison', 'Résolu']);
  if (alerts.length === 0) {
    dataRow(['Aucune alerte', '', '', '', '', '']);
  } else {
    alerts.forEach((a) => {
      dataRow(
        [
          new Date(a.created_at).toLocaleString('fr-FR'),
          a.passenger_name ?? '—',
          a.pnr ?? '—',
          a.tag_number ?? '—',
          a.reason,
          a.resolved ? 'Oui' : 'Non',
        ],
        { danger: !a.resolved },
      );
    });
  }

  // 5. Stats globales du jour
  section(`Statistiques globales — ${flight.date}`);
  dataRow(['Vols traités', dayIds.length]);
  dataRow(['Passagers enregistrés', dayPax ?? 0]);
  dataRow(['Bagages confirmés', dayBags ?? 0]);
  dataRow(['Alertes fraude détectées', dayFraud ?? 0]);

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rapport-${flight.flight_number}-${flight.date}.xlsx"`,
    },
  });
}
