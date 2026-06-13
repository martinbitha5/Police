'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { formatRoute, flightNumbersMatch, FLIGHT_STATUS_LABEL, type FlightStatus } from '@police/shared';
import type { PublicFlight, FlightsResponse } from '@/types';
import { useIsMobile } from '@/hooks/useIsMobile';

const STATUS_STYLE: Record<FlightStatus, { color: string; bg: string; border: string }> = {
  scheduled: { color: '#5c6470', bg: '#f3f4f6', border: '#d3d8de' },
  boarding: { color: '#15803d', bg: '#ecfdf3', border: '#bbe0c8' },
  closed: { color: '#b91c1c', bg: '#fef2f2', border: '#f1c5c5' },
  cancelled: { color: '#b45309', bg: '#fffbeb', border: '#f0d9a8' },
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

function FlightCard({ flight, hub, isMobile }: { flight: PublicFlight; hub: string; isMobile: boolean }) {
  const st = STATUS_STYLE[flight.status];
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
      <div style={s.cardLeft}>
        <span style={{ ...s.kindTag, ...(isDeparture ? s.kindDep : s.kindArr) }}>{kind}</span>
        <div style={s.flightNumber}>{flight.flight_number}</div>
        <div style={s.route}>{formatRoute(flight)}</div>
      </div>

      <div style={isMobile ? { ...s.cardRight, ...s.cardRightMobile } : s.cardRight}>
        <div style={isMobile ? { ...s.timeBlock, alignItems: 'flex-start' } : s.timeBlock}>
          <span style={s.timeLabel}>{isDeparture ? 'Départ' : 'Arrivée'}</span>
          <span style={s.time}>{timeOf(mainTime)}</span>
        </div>
        <div style={isMobile ? { ...s.badges, alignItems: 'flex-end' } : s.badges}>
          <span style={{ ...s.statusBadge, color: st.color, background: st.bg, borderColor: st.border }}>
            <span style={{ ...s.dot, background: st.color }} />
            {FLIGHT_STATUS_LABEL[flight.status]}
          </span>
          {delayed ? <span style={s.delayBadge}>Retardé</span> : null}
        </div>
      </div>
    </li>
  );
}

const surface: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
};

const s: Record<string, CSSProperties> = {
  pageWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  stickyHeader: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 14,
    padding: '14px 32px',
    background: 'linear-gradient(165deg, var(--side-bg), var(--side-bg-2))',
    borderBottom: '1px solid var(--side-border)',
    color: 'var(--side-text)',
  },
  stickyHeaderMobile: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch' as const,
    gap: 12,
    padding: '12px 16px',
    background: 'linear-gradient(165deg, var(--side-bg), var(--side-bg-2))',
    borderBottom: '1px solid var(--side-border)',
    color: 'var(--side-text)',
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
    border: '1px solid #f1c5c5',
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
    padding: '18px 22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    boxShadow: 'var(--shadow-sm)',
  },
  cardMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 14, padding: '16px' },
  cardLeft: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  kindTag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    borderRadius: 6,
    padding: '2px 10px',
    border: '1px solid',
  },
  kindDep: { color: '#1e4ed8', background: '#eef2fd', borderColor: '#c9d6f5' },
  kindArr: { color: '#6d28d9', background: '#f5f1fd', borderColor: '#ddd0f5' },
  flightNumber: { fontSize: 24, fontWeight: 800, letterSpacing: 0.3, color: 'var(--text)' },
  route: { color: 'var(--muted)', fontSize: 15, fontWeight: 600 },

  cardRight: { display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  cardRightMobile: {
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    borderTop: '1px solid var(--border)',
  },
  timeBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  timeLabel: { color: 'var(--faint)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  time: { fontSize: 26, fontWeight: 800, lineHeight: 1.1, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' },
  badges: { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 999,
    padding: '4px 12px',
    border: '1px solid',
  },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  delayBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--danger)',
    background: 'var(--danger-soft)',
    border: '1px solid #f1c5c5',
    borderRadius: 999,
    padding: '3px 10px',
  },

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
