import { NextResponse, type NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import type { Flight, Passenger, BaggageDispute } from '@police/shared';
import { formatRoute, DISPUTE_STATUS_LABEL } from '@police/shared';
import { createClient } from '@/supabase/server';

type DisputeRow = BaggageDispute & {
  passenger: Pick<Passenger, 'full_name' | 'pnr'> | null;
  flight: Flight | null;
};

const COLOR = {
  primary: 'FF2563EB',
  dark: 'FF0F172A',
  header: 'FF1E293B',
  danger: 'FFDC2626',
  light: 'FFF1F5F9',
  zebra: 'FFF8FAFC',
};

/** Date du jour au format YYYY-MM-DD (fuseau local). */
function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get('date') ?? '';
  const date = DATE_RE.test(dateParam) ? dateParam : todayISO();

  const supabase = await createClient();

  // RLS limite déjà baggage_disputes à admin/supervisor ; on confirme l'auth.
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // On ne charge que les vols de la journée choisie.
  const { data: flightsData } = await supabase.from('flights').select('*').eq('date', date);
  const flights = (flightsData as Flight[] | null) ?? [];
  const flightIds = flights.map((f) => f.id);
  const flightById = new Map(flights.map((f) => [f.id, f]));

  let disputes: DisputeRow[] = [];
  if (flightIds.length > 0) {
    const { data: dispData } = await supabase
      .from('baggage_disputes')
      .select('*, passenger:passengers(full_name, pnr), flight:flights(*)')
      .in('flight_id', flightIds)
      .order('created_at', { ascending: false });
    disputes = (dispData as DisputeRow[] | null) ?? [];
  }

  const total = disputes.length;
  const open = disputes.filter((d) => d.status === 'open').length;
  const investigating = disputes.filter((d) => d.status === 'investigating').length;
  const resolved = disputes.filter((d) => d.status === 'resolved').length;
  const fromPassenger = disputes.filter((d) => d.from_passenger).length;

  // ── Construction du classeur Excel ──────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Litiges bagage';
  wb.created = new Date();
  const ws = wb.addWorksheet('Litiges', {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 18 },
  });
  ws.columns = [
    { width: 18 },
    { width: 14 },
    { width: 26 },
    { width: 12 },
    { width: 20 },
    { width: 14 },
    { width: 26 },
    { width: 12 },
    { width: 18 },
  ];

  let r = 1;

  function title(text: string) {
    ws.mergeCells(r, 1, r, 9);
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
    ws.mergeCells(r, 2, r, 9);
    ws.getCell(r, 2).value = value;
    r += 1;
  }

  function section(text: string) {
    r += 1;
    ws.mergeCells(r, 1, r, 9);
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
  title('Rapport des litiges bagage');
  meta('Journée', date === todayISO() ? `${date} (aujourd'hui)` : date);
  meta('Vols traités', String(flightIds.length));
  meta('Édité le', new Date().toLocaleString('fr-FR'));

  // 2. Résumé
  section('Résumé');
  dataRow(['Total litiges', total]);
  dataRow(['Ouverts', open], { danger: open > 0 });
  dataRow(['En cours', investigating]);
  dataRow(['Résolus', resolved]);
  dataRow(['Réclamations passager', fromPassenger]);

  // 3. Détail des litiges
  section('Détail des litiges');
  headerRow(['Ouvert le', 'Étiquette', 'Passager', 'PNR', 'Vol / Route', 'Statut', 'Motif', 'Origine', 'Résolu le']);
  if (disputes.length === 0) {
    dataRow(['Aucun litige sur cette journée', '', '', '', '', '', '', '', '']);
  } else {
    disputes.forEach((d, i) => {
      const flight = d.flight ?? (d.flight_id ? flightById.get(d.flight_id) : null) ?? null;
      const route = flight ? `${flight.flight_number} · ${formatRoute(flight)}` : 'N/A';
      dataRow(
        [
          new Date(d.created_at).toLocaleString('fr-FR'),
          d.tag_number ?? 'N/A',
          d.passenger?.full_name ?? 'N/A',
          d.passenger?.pnr ?? 'N/A',
          route,
          DISPUTE_STATUS_LABEL[d.status],
          d.reason ?? 'N/A',
          d.from_passenger ? 'Passager' : 'Superviseur',
          d.resolved_at ? new Date(d.resolved_at).toLocaleString('fr-FR') : 'N/A',
        ],
        { danger: d.status !== 'resolved', zebra: i % 2 === 1 && d.status === 'resolved' },
      );
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="litiges-${date}.xlsx"`,
    },
  });
}
