'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Baggage, Passenger, Flight, BaggageDispute, DisputeStatus } from '@police/shared';
import { formatRoute, DISPUTE_STATUS_LABEL } from '@police/shared';
import { createClient } from '@/supabase/client';
import { AppShell, useSession } from '@/components/AppShell';
import { card, input, label, btnPrimary, btnGhost, badge, badgeTone, DISPUTE_BADGE } from '@/ui/theme';
import { IconSearch, IconClose, IconBag, IconUser, IconCheck, IconAlert, IconDownload } from '@/components/icons';

type BaggageRow = Baggage & {
  passenger: Passenger | null;
  flight: Flight | null;
};

const DISPUTE_STATUSES: DisputeStatus[] = ['open', 'investigating', 'resolved'];

/** Date du jour au format YYYY-MM-DD (fuseau local). */
function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function Page() {
  return (
    <AppShell>
      <LitigeView />
    </AppShell>
  );
}

function LitigeView() {
  const profile  = useSession();
  const isMobile = useIsMobile();
  const [rows, setRows] = useState<BaggageRow[]>([]);
  const [disputes, setDisputes] = useState<BaggageDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [flightFilter, setFlightFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(todayISO());
  const [loadFilter, setLoadFilter] = useState<'all' | 'loaded' | 'pending'>('all');
  const [disputeFilter, setDisputeFilter] = useState<'all' | 'none' | DisputeStatus>('all');

  const [selected, setSelected] = useState<BaggageRow | null>(null);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // On ne charge que les vols de la date choisie (pas toute la base).
    const { data: flightsData, error: fErr } = await supabase.from('flights').select('id').eq('date', date);
    if (fErr) {
      setError(fErr.message);
      setLoading(false);
      return;
    }
    const flightIds = ((flightsData as { id: string }[] | null) ?? []).map((f) => f.id);
    if (flightIds.length === 0) {
      setRows([]);
      setDisputes([]);
      setLoading(false);
      return;
    }

    const [bagRes, dispRes] = await Promise.all([
      supabase
        .from('baggage')
        .select('*, passenger:passengers(*), flight:flights(*)')
        .in('flight_id', flightIds)
        .order('scanned_at', { ascending: false }),
      supabase
        .from('baggage_disputes')
        .select('*')
        .in('flight_id', flightIds)
        .order('created_at', { ascending: false }),
    ]);
    if (bagRes.error) {
      setError(bagRes.error.message);
      setLoading(false);
      return;
    }
    setRows((bagRes.data as BaggageRow[] | null) ?? []);
    setDisputes((dispRes.data as BaggageDispute[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(dateFilter);
  }, [load, dateFilter]);

  // Litige le plus récent par bagage.
  const disputeByBag = useMemo(() => {
    const m = new Map<string, BaggageDispute>();
    for (const d of disputes) {
      if (d.baggage_id && !m.has(d.baggage_id)) m.set(d.baggage_id, d);
    }
    return m;
  }, [disputes]);

  const flightOptions = useMemo(() => {
    const m = new Map<string, Flight>();
    for (const r of rows) if (r.flight) m.set(r.flight.id, r.flight);
    return [...m.values()].sort((a, b) => a.flight_number.localeCompare(b.flight_number));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (flightFilter && r.flight?.id !== flightFilter) return false;
      if (loadFilter === 'loaded' && !r.is_confirmed) return false;
      if (loadFilter === 'pending' && r.is_confirmed) return false;
      const d = disputeByBag.get(r.id);
      if (disputeFilter === 'none' && d) return false;
      if (disputeFilter !== 'all' && disputeFilter !== 'none' && d?.status !== disputeFilter) return false;
      if (q) {
        const hay = `${r.tag_number} ${r.serial_number ?? ''} ${r.passenger?.pnr ?? ''} ${r.passenger?.full_name ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, flightFilter, loadFilter, disputeFilter, disputeByBag]);

  const openCount = useMemo(() => disputes.filter((d) => d.status !== 'resolved').length, [disputes]);

  return (
    <div style={isMobile ? { ...s.wrap, ...s.wrapMobile } : s.wrap}>
      <header style={isMobile ? { ...s.header, ...s.headerMobile } : s.header}>
        <div>
          <h1 style={s.title}>Litiges bagage</h1>
          <p style={s.sub}>
            {dateFilter === todayISO() ? "Aujourd'hui" : dateFilter} · {rows.length} bagage{rows.length > 1 ? 's' : ''} ·{' '}
            {openCount} litige{openCount > 1 ? 's' : ''} en cours
          </p>
        </div>
        <a
          style={{ ...btnPrimary, textDecoration: 'none' }}
          href={`/api/report?date=${dateFilter}`}
          download
        >
          <IconDownload size={16} />
          Rapport du jour
        </a>
      </header>

      <div style={{ ...card, padding: 16 }}>
        <div style={isMobile ? { ...s.filters, ...s.filtersMobile } : s.filters}>
          <div style={s.searchBox}>
            <IconSearch size={16} />
            <input
              style={s.searchInput}
              placeholder="Tag, série, PNR ou nom passager…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select style={s.select} value={flightFilter} onChange={(e) => setFlightFilter(e.target.value)}>
            <option value="">Tous les vols</option>
            {flightOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.flight_number} · {formatRoute(f)}
              </option>
            ))}
          </select>
          <div style={s.dateGroup}>
            <input
              type="date"
              style={s.dateInput}
              value={dateFilter}
              max={todayISO()}
              onChange={(e) => setDateFilter(e.target.value || todayISO())}
            />
            <button
              style={{ ...s.todayBtn, ...(dateFilter === todayISO() ? s.todayBtnActive : {}) }}
              onClick={() => setDateFilter(todayISO())}
              type="button"
            >
              Aujourd'hui
            </button>
          </div>
          <select style={s.select} value={loadFilter} onChange={(e) => setLoadFilter(e.target.value as typeof loadFilter)}>
            <option value="all">Chargement : tous</option>
            <option value="loaded">Chargés</option>
            <option value="pending">En attente</option>
          </select>
          <select
            style={s.select}
            value={disputeFilter}
            onChange={(e) => setDisputeFilter(e.target.value as typeof disputeFilter)}
          >
            <option value="all">Litige : tous</option>
            <option value="none">Sans litige</option>
            {DISPUTE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {DISPUTE_STATUS_LABEL[st]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div style={s.error}>Erreur : {error}</div> : null}

      {isMobile ? (
        // Mobile : cartes empilées (la table à 8 colonnes scrollerait horizontalement).
        loading ? (
          <div style={{ ...card }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...card }}>Aucun bagage ne correspond.</div>
        ) : (
          <div style={s.bagCardList}>
            {filtered.map((r) => {
              const d = disputeByBag.get(r.id);
              return (
                <button key={r.id} style={s.bagCard} onClick={() => setSelected(r)}>
                  <div style={s.bagCardHead}>
                    <span style={s.bagCardTag}>{r.tag_number}</span>
                    {r.is_confirmed ? (
                      <span style={{ ...badge, ...badgeTone.positive }}>Chargé</span>
                    ) : (
                      <span style={{ ...badge, ...badgeTone.neutral }}>En attente</span>
                    )}
                  </div>
                  <div style={s.bagCardRoute}>
                    {r.flight?.flight_number ?? 'N/A'} · {r.flight ? formatRoute(r.flight) : 'N/A'}
                  </div>
                  <div style={s.bagCardPax}>
                    {r.passenger?.full_name ?? 'N/A'} · PNR {r.passenger?.pnr ?? 'N/A'} · Série {r.serial_number ?? 'N/A'}
                  </div>
                  {d ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                      <span style={{ ...badge, ...DISPUTE_BADGE[d.status] }}>
                        {DISPUTE_STATUS_LABEL[d.status]}
                      </span>
                      {d.from_passenger ? (
                        <span style={{ ...badge, ...badgeTone.neutral }}>Passager</span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )
      ) : (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Étiquette</th>
                  <th style={s.th}>Série</th>
                  <th style={s.th}>Chargement</th>
                  <th style={s.th}>Vol</th>
                  <th style={s.th}>Route</th>
                  <th style={s.th}>PNR</th>
                  <th style={s.th}>Passager</th>
                  <th style={s.th}>Litige</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={s.empty} colSpan={8}>
                      Chargement…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td style={s.empty} colSpan={8}>
                      Aucun bagage ne correspond.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const d = disputeByBag.get(r.id);
                    return (
                      <tr key={r.id} style={s.tr} onClick={() => setSelected(r)}>
                        <td style={s.tdMono}>{r.tag_number}</td>
                        <td style={s.tdMono}>{r.serial_number ?? 'N/A'}</td>
                        <td style={s.td}>
                          {r.is_confirmed ? (
                            <span style={{ ...badge, ...badgeTone.positive }}>Chargé</span>
                          ) : (
                            <span style={{ ...badge, ...badgeTone.neutral }}>En attente</span>
                          )}
                        </td>
                        <td style={s.td}>{r.flight?.flight_number ?? 'N/A'}</td>
                        <td style={s.td}>{r.flight ? formatRoute(r.flight) : 'N/A'}</td>
                        <td style={s.tdMono}>{r.passenger?.pnr ?? 'N/A'}</td>
                        <td style={s.td}>{r.passenger?.full_name ?? 'N/A'}</td>
                        <td style={s.td}>
                          {d ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ ...badge, ...DISPUTE_BADGE[d.status] }}>
                                {DISPUTE_STATUS_LABEL[d.status]}
                              </span>
                              {d.from_passenger ? (
                                <span style={{ ...badge, ...badgeTone.neutral }}>Passager</span>
                              ) : null}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--content-secondary)' }}>Aucun</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected ? (
        <DisputePanel
          row={selected}
          dispute={disputeByBag.get(selected.id) ?? null}
          userId={profile?.id ?? null}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            setSelected(null);
            await load(dateFilter);
          }}
        />
      ) : null}

      <AirportLinks />
    </div>
  );
}

const AIRPORT_LINKS = [
  { href: 'https://fih-rva.com/guide/securite-bagages', label: 'Sécurité bagages', desc: 'Règles et objets interdits' },
  { href: 'https://fih-rva.com/guide', label: 'Guide voyageur', desc: 'Visa, vaccins, douanes' },
  { href: 'https://fih-rva.com/contact', label: 'Contact aéroport', desc: 'RVA · Régie des Voies Aériennes' },
];

function AirportLinks() {
  return (
    <div style={al.wrap}>
      <a style={al.main} href="https://fih-rva.com" target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <span style={al.logoWrap}><img src="/fih-logo.png" alt="RVA" width={28} height={28} style={{ objectFit: 'contain' }} /></span>
        <span style={al.mainTexts}>
          <span style={al.mainName}>Site officiel · Aéroport International de Kinshasa (FIH)</span>
          <span style={al.mainUrl}>fih-rva.com · Régie des Voies Aériennes</span>
        </span>
        <ExternalIcon />
      </a>
      <div style={al.grid}>
        {AIRPORT_LINKS.map((l) => (
          <a key={l.href} style={al.card} href={l.href} target="_blank" rel="noopener noreferrer">
            <span style={al.cardTexts}>
              <span style={al.cardLabel}>{l.label}</span>
              <span style={al.cardDesc}>{l.desc}</span>
            </span>
            <ExternalIcon />
          </a>
        ))}
      </div>
    </div>
  );
}

function ExternalIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
      <path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>
    </svg>
  );
}

const al: Record<string, CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  main: { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-neutral)', border: 'none', borderRadius: 16, padding: '14px 18px', color: 'var(--content-primary)' },
  logoWrap: { width: 44, height: 44, borderRadius: 9999, background: '#fff', boxShadow: 'inset 0 0 0 1px var(--border-neutral)', display: 'grid', placeItems: 'center', flexShrink: 0 },
  mainTexts: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  mainName: { fontSize: 14, fontWeight: 600 },
  mainUrl: { fontSize: 12, color: 'var(--content-secondary)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 },
  card: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-neutral)', borderRadius: 16, padding: '12px 14px', color: 'var(--content-primary)' },
  cardTexts: { display: 'flex', flexDirection: 'column', gap: 2 },
  cardLabel: { fontSize: 14, fontWeight: 600 },
  cardDesc: { fontSize: 12, color: 'var(--content-secondary)' },
};

function DisputePanel({
  row,
  dispute,
  userId,
  onClose,
  onSaved,
}: {
  row: BaggageRow;
  dispute: BaggageDispute | null;
  userId: string | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const fromPassenger = !!dispute?.from_passenger;
  const [reason, setReason] = useState(dispute?.reason ?? '');
  const [notes, setNotes] = useState(dispute?.notes ?? '');
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [status, setStatus] = useState<DisputeStatus>(dispute?.status ?? 'open');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const resolving = status === 'resolved';
    if (dispute) {
      const updatePayload: Record<string, unknown> = {
        status,
        resolved_at: resolving ? new Date().toISOString() : null,
        resolved_by: resolving ? userId : null,
      };
      if (fromPassenger) {
        if (supervisorNotes.trim()) {
          const stamp = new Date().toLocaleString('fr-FR');
          const block = `[Note superviseur · ${stamp}]\n${supervisorNotes.trim()}`;
          updatePayload.notes = dispute.notes ? `${dispute.notes}\n\n${block}` : block;
        }
      } else {
        updatePayload.reason = reason.trim() || null;
        updatePayload.notes = notes.trim() || null;
      }
      const { error } = await supabase
        .from('baggage_disputes')
        .update(updatePayload)
        .eq('id', dispute.id);
      if (error) {
        setErr(error.message);
        setBusy(false);
        return;
      }
    } else {
      const { error } = await supabase.from('baggage_disputes').insert({
        baggage_id: row.id,
        flight_id: row.flight_id,
        passenger_id: row.passenger_id,
        tag_number: row.tag_number,
        status,
        reason: reason.trim() || null,
        notes: notes.trim() || null,
        created_by: userId,
        resolved_at: resolving ? new Date().toISOString() : null,
        resolved_by: resolving ? userId : null,
      });
      if (error) {
        setErr(error.message);
        setBusy(false);
        return;
      }
    }
    await onSaved();
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.panel} onClick={(e) => e.stopPropagation()}>
        <div style={s.panelHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconBag size={20} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{row.tag_number}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                {dispute
                  ? dispute.from_passenger
                    ? 'Réclamation passager'
                    : 'Litige existant'
                  : 'Ouvrir un litige'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={s.iconBtn} aria-label="Fermer">
            <IconClose size={18} />
          </button>
        </div>

        <div style={s.detailGrid}>
          <Detail icon={<IconUser size={15} />} label="Passager" value={row.passenger?.full_name ?? 'N/A'} />
          <Detail label="PNR" value={row.passenger?.pnr ?? 'N/A'} mono />
          <Detail label="Vol" value={row.flight?.flight_number ?? 'N/A'} />
          <Detail label="Route" value={row.flight ? formatRoute(row.flight) : 'N/A'} />
          <Detail label="Date vol" value={row.flight?.date ?? 'N/A'} />
          <Detail label="Série" value={row.serial_number ?? 'N/A'} mono />
          <Detail
            label="Chargement"
            value={row.is_confirmed ? 'Chargé (étiquette scannée)' : 'En attente'}
          />
          <Detail
            label="Compartiment soute"
            value={row.soute === 'avant' ? 'Soute avant' : row.soute === 'arriere' ? 'Soute arrière' : 'N/A'}
          />
          <Detail
            label="Bagages déclarés"
            value={row.passenger ? String(row.passenger.declared_baggage_count) : 'N/A'}
          />
        </div>

        <div style={s.formCol}>
          <div>
            <label style={label}>Statut du litige</label>
            <select style={{ ...input, marginTop: 6 }} value={status} onChange={(e) => setStatus(e.target.value as DisputeStatus)}>
              {DISPUTE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {DISPUTE_STATUS_LABEL[st]}
                </option>
              ))}
            </select>
          </div>
          {fromPassenger ? (
            <>
              <div>
                <label style={label}>Motif (signalé par le passager)</label>
                <div style={{ ...input, marginTop: 6, background: 'var(--surface-alt)', color: 'var(--muted)', cursor: 'default', userSelect: 'text' }}>
                  {reason || 'N/A'}
                </div>
              </div>
              <div>
                <label style={label}>Signalement passager</label>
                <pre style={{ ...input, marginTop: 6, minHeight: 90, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', fontSize: 13, background: 'var(--surface-alt)', color: 'var(--muted)', cursor: 'default', overflowX: 'auto', margin: 0 }}>
                  {notes || 'N/A'}
                </pre>
              </div>
              <div>
                <label style={label}>Notes superviseur</label>
                <textarea
                  style={{ ...input, marginTop: 6, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Votre note interne, actions prises…"
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={label}>Motif</label>
                <input
                  style={{ ...input, marginTop: 6 }}
                  placeholder="Bagage égaré, non réclamé, endommagé…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div>
                <label style={label}>Notes</label>
                <textarea
                  style={{ ...input, marginTop: 6, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Détails de l'enquête, actions prises…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {err ? (
            <div style={{ ...s.error, marginTop: 0 }}>
              <IconAlert size={15} /> {err}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button style={btnGhost} onClick={onClose} disabled={busy}>
              Annuler
            </button>
            <button style={btnPrimary} onClick={save} disabled={busy}>
              <IconCheck size={16} />
              {busy ? 'Enregistrement…' : dispute ? 'Mettre à jour' : 'Ouvrir le litige'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label: lab, value, mono }: { icon?: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ ...label, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        {lab}
      </div>
      <div style={{ marginTop: 3, fontSize: 14, fontFamily: mono ? 'ui-monospace, monospace' : 'inherit' }}>{value}</div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  wrap: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1280, margin: '0 auto' },
  wrapMobile: { padding: '16px 12px', gap: 14 },
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
  title: { margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 },
  sub: { margin: '6px 0 0', color: 'var(--content-secondary)', fontSize: 14 },

  filters: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  filtersMobile: { flexDirection: 'column', alignItems: 'stretch' },

  bagCardList: { display: 'flex', flexDirection: 'column', gap: 10 },
  bagCard: { ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', cursor: 'pointer', width: '100%' },
  bagCardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  bagCardTag: { fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 15 },
  bagCardRoute: { fontSize: 14, fontWeight: 600 },
  bagCardPax: { color: 'var(--content-secondary)', fontSize: 12.5 },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 240,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-neutral)',
    borderRadius: 10,
    padding: '0 12px',
    color: 'var(--content-secondary)',
  },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--content-primary)', fontSize: 15, padding: '11px 0' },
  select: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-neutral)',
    borderRadius: 10,
    padding: '10px 12px',
    color: 'var(--content-primary)',
    fontSize: 14,
    colorScheme: 'light',
  },
  dateGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  dateInput: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-neutral)',
    borderRadius: 10,
    padding: '10px 12px',
    color: 'var(--content-primary)',
    fontSize: 14,
    colorScheme: 'light',
  },
  todayBtn: {
    background: 'transparent',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border-neutral)',
    borderRadius: 9999,
    padding: '10px 16px',
    color: 'var(--content-secondary)',
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  todayBtnActive: { background: 'var(--bg-neutral-hover)', color: 'var(--brand-forest)', borderColor: 'transparent' },

  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    color: 'var(--content-secondary)',
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '-0.01em',
    borderBottom: '1px solid var(--border-neutral)',
    whiteSpace: 'nowrap',
  },
  tr: { cursor: 'pointer', borderBottom: '1px solid var(--border-neutral)' },
  td: { padding: '12px 16px', whiteSpace: 'nowrap' },
  tdMono: { padding: '12px 16px', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' },
  empty: { padding: '32px 16px', textAlign: 'center', color: 'var(--content-secondary)' },

  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--negative-bg)',
    border: 'none',
    color: 'var(--negative)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(14,15,12,0.4)',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    zIndex: 50,
  },
  panel: {
    width: 'min(680px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-neutral)',
    borderRadius: 24,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  panelHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--content-primary)',
    borderRadius: 9999,
    padding: 8,
    display: 'grid',
    placeItems: 'center',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
    gap: 14,
    padding: 20,
    background: 'var(--bg-neutral)',
    borderRadius: 16,
    border: 'none',
  },
  formCol: { display: 'flex', flexDirection: 'column', gap: 14 },
};
