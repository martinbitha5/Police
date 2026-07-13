'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { formatRoute, flightNumbersMatch, FLIGHT_STATUS_LABEL, type FlightStatus } from '@police/shared';
import type { PublicFlight, FlightsResponse } from '@/types';
import { useIsMobile } from '@/hooks/useIsMobile';

/** Statut vol : un point coloré + texte neutre — pas de pastille.
    Teintes éclaircies pour le fond sombre du spatial UI. */
const STATUS_DOT: Record<FlightStatus, string> = {
  scheduled: '#94a3b8',
  boarding: '#4ade80',
  closed: '#f87171',
  cancelled: '#fbbf24',
};

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function timeOf(ts: string | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Enregistrement : ouvre 3 h avant le départ, clôture 45 min avant.
// (Valeurs standard aéroport — modifiables ici si la règle change.)
const CHECKIN_OPENS_BEFORE_MS = 3 * 60 * 60 * 1000;
const CHECKIN_CLOSES_BEFORE_MS = 45 * 60 * 1000;

type CheckInPhase = 'before' | 'open' | 'closed' | 'departed';

/** Compte à rebours : « 2 h 13 » au-delà d'une heure, « 42:07 » (mm:ss) en dessous. */
function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Seule la couleur du point de statut varie — le reste est typographique. */
const CHECKIN_DOT: Record<CheckInPhase, string> = {
  before: '#94a3b8',
  open: '#4ade80',
  closed: '#fbbf24',
  departed: '#c3c9d1',
};

export default function VolsPage() {
  const [date, setDate] = useState(todayISO());
  const [hub, setHub] = useState('FIH');
  const [flights, setFlights] = useState<PublicFlight[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const isMobile = useIsMobile();

  const load = useCallback(async (d: string, showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`/api/flights?date=${d}`, { cache: 'no-store' });
      const data = (await res.json()) as FlightsResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Erreur de chargement.');
      } else {
        setFlights(data.flights);
        setHub(data.hub);
        setError(null);
        setUpdatedAt(new Date());
      }
    } catch {
      setError('Connexion impossible. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial + à chaque changement de jour.
  useEffect(() => {
    void load(date, true);
  }, [load, date]);

  // Rafraîchissement automatique toutes les 30 s (statuts en temps réel).
  // Bascule aussi sur le nouveau jour dès que minuit est passé : on n'affiche
  // jamais les vols d'hier — seulement ceux du jour en cours.
  useEffect(() => {
    const id = setInterval(() => {
      const t = todayISO();
      if (t !== date) setDate(t);
      else void load(date);
    }, 30_000);
    return () => clearInterval(id);
  }, [load, date]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return flights;
    return flights.filter(
      (f) => flightNumbersMatch(f.flight_number, q) || f.flight_number.toLowerCase().includes(q.toLowerCase()),
    );
  }, [flights, query]);

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={s.pageWrap}>
      <header style={isMobile ? s.stickyHeaderMobile : s.stickyHeader}>
        <div style={s.brandBlock}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/air.png" alt="Air Congo" style={isMobile ? { ...s.logo, height: 36 } : s.logo} />
          <div>
            <h1 style={isMobile ? { ...s.title, ...s.titleMobile } : s.title}>Vols du jour</h1>
            <p style={s.subtitle}>
              {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} · Aéroport {hub}
              {updatedAt ? ` · maj ${updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          </div>
        </div>
        <div style={isMobile ? { ...s.controls, ...s.controlsMobile } : s.controls}>
          <input
            style={isMobile ? { ...s.search, ...s.searchMobile } : s.search}
            placeholder="Rechercher un vol (ex. ET0062)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <main style={isMobile ? { ...s.shell, ...s.shellMobile } : s.shell}>
        <div style={s.container}>
          {error ? <div style={s.error}>{error}</div> : null}

          {loading ? (
            <div style={s.loader}>
              <span style={s.spinner} />
              <span>Chargement des vols…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              {query ? 'Aucun vol ne correspond à votre recherche.' : "Aucun vol programmé aujourd'hui."}
            </div>
          ) : (
            <ul style={s.list}>
              {filtered.map((f) => (
                <FlightCard
                  key={`${f.flight_number}-${f.departure_time ?? f.date}`}
                  flight={f}
                  hub={hub}
                  isMobile={isMobile}
                />
              ))}
            </ul>
          )}

          <AirportServices />

          <footer style={s.footer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/air.png" alt="Air Congo" style={s.footerLogo} />
            <nav style={s.footerNav}>
              <Link href="/conditions" style={s.footerLink}>Conditions d'utilisation</Link>
              <Link href="/confidentialite" style={s.footerLink}>Confidentialité</Link>
              <Link href="/cookies" style={s.footerLink}>Cookies</Link>
            </nav>
            <p style={s.footerText}>Informations fournies à titre indicatif · Police Bagage · ATS Handling</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

const AIRPORT_SITE = 'https://fih-rva.com';

const AIRPORT_LINKS: { href: string; title: string; desc: string }[] = [
  { href: '/vols/departs', title: 'Départs & arrivées', desc: 'Horaires temps réel sur le portail officiel' },
  { href: '/guide', title: 'Guide du voyageur', desc: 'Visa, vaccination fièvre jaune, douanes' },
  { href: '/guide/securite-bagages', title: 'Sécurité bagages', desc: 'Règles, objets interdits, franchise' },
  { href: '/stationnement-transport', title: 'Stationnement & transport', desc: 'Parking, taxis agréés, navettes' },
  { href: '/boutiques-restaurants', title: 'Boutiques & restaurants', desc: 'Change, duty free, salons VIP' },
  { href: '/contact', title: 'Contact', desc: "Joindre l'aéroport (RVA)" },
];

/** Liens vers le portail officiel de l'Aéroport International de Kinshasa (FIH). */
function AirportServices() {
  return (
    <section style={s.servicesWrap}>
      <h2 style={s.servicesTitle}>Services de l'aéroport</h2>

      <a style={s.siteBanner} href={AIRPORT_SITE} target="_blank" rel="noopener noreferrer">
        <span style={s.siteIcon}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fih-logo.png" alt="Logo RVA — Aéroport de Kinshasa" width={32} height={32} style={s.siteLogo} />
        </span>
        <span style={s.siteTexts}>
          <span style={s.siteName}>Site officiel de l'Aéroport International de Kinshasa (FIH)</span>
          <span style={s.siteUrl}>fih-rva.com · Régie des Voies Aériennes</span>
        </span>
        <ExternalIcon />
      </a>

      <div style={s.linksGrid}>
        {AIRPORT_LINKS.map((l) => (
          <a
            key={l.href}
            className="fl-link"
            style={s.linkCard}
            href={`${AIRPORT_SITE}${l.href}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span style={s.linkTexts}>
              <span style={s.linkTitle}>{l.title}</span>
              <span style={s.linkDesc}>{l.desc}</span>
            </span>
            <ExternalIcon />
          </a>
        ))}
      </div>
    </section>
  );
}

function ExternalIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.75 }}>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

/**
 * Ligne d'information enregistrement pour un vol au départ — pied de carte sobre.
 * L'enregistrement ouvre 3 h avant le départ et clôture 45 min avant.
 * Ticke chaque seconde ; seule la ponctuation typographique porte le statut.
 */
function CheckInBadge({ departureTime }: { departureTime: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const dep = new Date(departureTime).getTime();
  if (Number.isNaN(dep)) return null;

  const openAt = dep - CHECKIN_OPENS_BEFORE_MS;
  const closeAt = dep - CHECKIN_CLOSES_BEFORE_MS;

  let phase: CheckInPhase;
  if (now < openAt) phase = 'before';
  else if (now < closeAt) phase = 'open';
  else if (now < dep) phase = 'closed';
  else phase = 'departed';

  const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  let title: string;
  let caption: string;
  let countPrefix: string | null = null;
  let countValue: string | null = null;

  switch (phase) {
    case 'before':
      title = 'Enregistrement';
      caption = `Ouverture à ${fmtTime(openAt)}`;
      countPrefix = 'ouvre dans';
      countValue = formatCountdown(openAt - now);
      break;
    case 'open':
      title = 'Enregistrement ouvert';
      caption = `Clôture à ${fmtTime(closeAt)}`;
      countPrefix = 'clôture dans';
      countValue = formatCountdown(closeAt - now);
      break;
    case 'closed':
      title = 'Enregistrement clôturé';
      caption = 'Embarquement en cours';
      break;
    default:
      title = 'Enregistrement terminé';
      caption = 'Vol parti';
  }

  return (
    <div style={s.checkin}>
      <div style={s.checkinLeft}>
        <span
          className={phase === 'open' ? 'ci-dot-live' : undefined}
          style={{ ...s.checkinDot, background: CHECKIN_DOT[phase] }}
        />
        <span style={s.checkinTitle}>{title}</span>
        <span style={s.checkinSep} aria-hidden />
        <span style={s.checkinCaption}>{caption}</span>
      </div>

      {countValue ? (
        <div style={s.checkinCount}>
          <span style={s.checkinCountPrefix}>{countPrefix}</span>
          <span style={s.checkinCountValue}>{countValue}</span>
        </div>
      ) : null}
    </div>
  );
}

function FlightCard({ flight, hub, isMobile }: { flight: PublicFlight; hub: string; isMobile: boolean }) {
  const isDeparture = flight.origin === hub;
  const kind = isDeparture ? 'Départ' : 'Arrivée';
  const mainTime = isDeparture ? flight.departure_time : flight.arrival_time;

  // Retard estimé : heure prévue dépassée et vol ni fermé ni annulé.
  const delayed =
    mainTime != null &&
    (flight.status === 'scheduled' || flight.status === 'boarding') &&
    new Date(mainTime).getTime() < Date.now();

  return (
    <li className="fl-card" style={isMobile ? { ...s.card, ...s.cardMobile } : s.card}>
      <div style={s.cardMain}>
        <div style={s.timeBlock}>
          <span style={s.time}>{timeOf(mainTime)}</span>
          <span style={s.kindLabel}>{kind}</span>
        </div>
        <span style={s.vSep} aria-hidden />
        <div style={s.cardInfo}>
          <div style={s.flightNumber}>{flight.flight_number}</div>
          <div style={s.route}>{formatRoute(flight)}</div>
        </div>
        <div style={isMobile ? { ...s.statusBlock, ...s.statusBlockMobile } : s.statusBlock}>
          <span style={s.statusText}>
            <span style={{ ...s.dot, background: STATUS_DOT[flight.status] }} />
            {FLIGHT_STATUS_LABEL[flight.status]}
          </span>
          {delayed ? <span style={s.delayText}>Retardé</span> : null}
        </div>
      </div>

      {isDeparture && mainTime && flight.status !== 'cancelled' ? (
        <CheckInBadge departureTime={mainTime} />
      ) : null}
    </li>
  );
}

// Panneau en verre dépoli — teinté navy + flou du fond (spatial UI).
const surface: CSSProperties = {
  background: 'var(--glass)',
  border: '1px solid var(--glass-border)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
};

// En-tête translucide flottant, flou du fond photo derrière.
const headerGlass: CSSProperties = {
  background: 'rgba(9, 14, 26, 0.6)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  borderBottom: '1px solid var(--glass-border)',
  color: 'var(--side-text)',
};

const s: Record<string, CSSProperties> = {
  pageWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  stickyHeader: {
    ...headerGlass,
    position: 'sticky' as const,
    top: 0,
    zIndex: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 14,
    padding: '14px 32px',
  },
  stickyHeaderMobile: {
    ...headerGlass,
    position: 'sticky' as const,
    top: 0,
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch' as const,
    gap: 12,
    padding: '12px 16px',
  },
  shell: { flex: 1, display: 'flex', justifyContent: 'center', padding: '28px 20px 48px' },
  shellMobile: { padding: '18px 12px 32px' },
  container: { width: '100%', maxWidth: 980, display: 'flex', flexDirection: 'column', gap: 20 },

  brandBlock: { display: 'flex', alignItems: 'center', gap: 14 },
  logo: { height: 44, objectFit: 'contain' as const, flexShrink: 0 },
  footerLogo: { height: 36, objectFit: 'contain' as const, opacity: 0.9, display: 'block', margin: '0 auto 6px' },
  title: { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: -0.6, color: '#fff' },
  titleMobile: { fontSize: 24 },
  subtitle: { margin: '4px 0 0', color: 'var(--side-muted)', fontSize: 13.5, fontWeight: 600 },
  controls: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  controlsMobile: { flexDirection: 'column', alignItems: 'stretch', width: '100%' },
  search: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 14,
    minWidth: 240,
    colorScheme: 'dark',
  },
  searchMobile: { minWidth: 0, width: '100%' },

  error: {
    background: 'var(--danger-soft)',
    color: 'var(--danger)',
    border: '1px solid rgba(248,113,113,0.35)',
    borderRadius: 10,
    padding: '14px 18px',
    fontWeight: 600,
  },

  loader: {
    ...surface,
    borderRadius: 12,
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    color: 'var(--muted)',
    boxShadow: 'var(--shadow-sm)',
  },
  spinner: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '3px solid var(--border)',
    borderTopColor: 'var(--primary)',
    animation: 'spin 0.8s linear infinite',
  },
  empty: { ...surface, borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', boxShadow: 'var(--shadow-sm)' },

  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    ...surface,
    borderRadius: 12,
    padding: '16px 22px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
  },
  cardMobile: { padding: '14px 16px' },
  cardMain: { display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' },
  timeBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 76 },
  time: {
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1.1,
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: -0.4,
  },
  kindLabel: {
    color: 'var(--faint)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  vSep: { width: 1, alignSelf: 'stretch', background: 'var(--border)', flexShrink: 0 },
  cardInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  flightNumber: { fontSize: 18, fontWeight: 800, letterSpacing: 0.2, color: 'var(--text)' },
  route: { color: 'var(--muted)', fontSize: 14, fontWeight: 500 },
  statusBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  statusBlockMobile: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  statusText: { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  checkin: {
    width: '100%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
    rowGap: 5,
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 12,
    borderTop: '1px solid var(--border)',
  },
  checkinLeft: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' },
  checkinDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  checkinTitle: { fontSize: 13.5, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.1 },
  checkinSep: { width: 1, height: 12, background: 'var(--border-strong)', flexShrink: 0 },
  checkinCaption: { fontSize: 13, fontWeight: 500, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' },
  checkinCount: { display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 },
  checkinCountPrefix: { fontSize: 12.5, fontWeight: 500, color: 'var(--muted)' },
  checkinCountValue: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 0.2,
  },
  delayText: { fontSize: 12.5, fontWeight: 700, color: 'var(--danger)' },

  footer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 20, borderTop: '1px solid var(--border)' },
  footerNav: { display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' },
  footerLink: { color: 'var(--muted)', fontSize: 13, fontWeight: 600 },
  footerText: { color: 'var(--faint)', fontSize: 12, textAlign: 'center', margin: 0 },

  servicesWrap: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 },
  servicesTitle: { margin: '4px 0', fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: 'var(--text)' },
  siteBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    borderRadius: 12,
    padding: '16px 18px',
    color: '#fff',
    background: 'linear-gradient(135deg, #13233f, #0c1322)',
    border: '1px solid var(--side-border)',
    boxShadow: 'var(--shadow-md)',
  },
  siteIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 10,
    background: '#ffffff',
    flexShrink: 0,
    overflow: 'hidden',
  },
  siteLogo: { width: 32, height: 32, objectFit: 'contain' },
  siteTexts: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  siteName: { fontSize: 15, fontWeight: 700 },
  siteUrl: { fontSize: 13, color: '#8e99ad', fontWeight: 500 },

  linksGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 },
  linkCard: {
    ...surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 10,
    padding: '14px 16px',
    color: 'var(--text)',
    boxShadow: 'var(--shadow-sm)',
  },
  linkTexts: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  linkTitle: { fontSize: 14.5, fontWeight: 700 },
  linkDesc: { fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 },
};
