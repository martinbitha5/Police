'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  formatRoute,
  flightNumbersMatch,
  FLIGHT_STATUS_LABEL,
  AIRPORTS,
  findAirport,
  airportLabel,
  type FlightStatus,
} from '@police/shared';
import type { PublicFlight, FlightsResponse } from '@/types';
import { useIsMobile } from '@/hooks/useIsMobile';

/** Aéroport choisi par le visiteur — mémorisé d'une visite à l'autre. */
const CITY_KEY = 'vols.airport';

/** Statut vol : pastille pilule colorée (design Wise) — fond doux + texte foncé,
    lisible de loin sur fond blanc. À l'heure/embarquement = vert, porte fermée = jaune, annulé = rouge. */
const STATUS_PILL: Record<FlightStatus, { bg: string; fg: string }> = {
  scheduled: { bg: 'var(--positive-bg)', fg: 'var(--positive)' },
  boarding: { bg: 'var(--positive-bg)', fg: 'var(--positive)' },
  closed: { bg: 'var(--warning-bg)', fg: 'var(--warning-content)' },
  cancelled: { bg: 'var(--negative-bg)', fg: 'var(--negative)' },
};

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function timeOf(ts: string | null): string {
  if (!ts) return 'N/A';
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
  before: '#6A6C6A',
  open: '#054D28',
  closed: '#4A3B1C',
  departed: '#A8AAA8',
};

export default function VolsPage() {
  const [date, setDate] = useState(todayISO());
  // Aéroport du visiteur : null tant qu'il n'a pas choisi (on affiche le sélecteur).
  // `cityReady` évite de montrer le sélecteur avant d'avoir relu le choix mémorisé.
  const [city, setCity] = useState<string | null>(null);
  const [cityReady, setCityReady] = useState(false);
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
        setError(data.error ?? 'Impossible de charger les vols. Réessayez.');
      } else {
        setFlights(data.flights);
        setError(null);
        setUpdatedAt(new Date());
      }
    } catch {
      setError('Connexion impossible. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Relit l'aéroport mémorisé au premier rendu client.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CITY_KEY);
      if (saved && findAirport(saved)) setCity(saved.trim().toUpperCase());
    } catch {
      // localStorage indisponible (navigation privée) : on demandera à chaque visite.
    }
    setCityReady(true);
  }, []);

  const chooseCity = useCallback((code: string) => {
    setCity(code);
    try {
      localStorage.setItem(CITY_KEY, code);
    } catch {
      // Choix non mémorisé — sans conséquence pour la session en cours.
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

  // Départs / arrivées vus depuis l'aéroport du visiteur. Un vol qui fait escale
  // dans sa ville y arrive ET en repart : il figure donc dans les deux tableaux,
  // comme sur un affichage d'aéroport.
  const { departures, arrivals } = useMemo(() => {
    if (!city) return { departures: [], arrivals: [] };
    const serves = (f: PublicFlight) => (f.stops ?? []).includes(city);
    return {
      departures: filtered.filter((f) => f.origin === city || serves(f)),
      arrivals: filtered.filter((f) => f.destination === city || serves(f)),
    };
  }, [filtered, city]);

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
              {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
              {city ? ` · ${airportLabel(city)}` : ''}
              {updatedAt ? ` · mis à jour à ${updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          </div>
        </div>
        {city ? (
          <div style={isMobile ? { ...s.controls, ...s.controlsMobile } : s.controls}>
            <input
              style={isMobile ? { ...s.search, ...s.searchMobile } : s.search}
              placeholder="Recherchez votre vol (ex. ET0062)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" style={s.changeCityBtn} onClick={() => setCity(null)}>
              Changer d’aéroport
            </button>
          </div>
        ) : null}
      </header>

      <main style={isMobile ? { ...s.shell, ...s.shellMobile } : s.shell}>
        <div style={s.container}>
          {error ? <div style={s.error}>{error}</div> : null}

          {!cityReady ? null : !city ? (
            <CityPicker onPick={chooseCity} isMobile={isMobile} />
          ) : loading ? (
            <div style={s.loader}>
              <span style={s.spinner} />
              <span>Chargement des vols…</span>
            </div>
          ) : (
            <>
              <FlightBoard
                title="Départs"
                subtitle={`Au départ de ${airportLabel(city)}`}
                flights={departures}
                kind="departure"
                emptyLabel={query ? 'Aucun départ ne correspond à votre recherche.' : 'Aucun départ programmé aujourd’hui.'}
                isMobile={isMobile}
              />
              <FlightBoard
                title="Arrivées"
                subtitle={`À destination de ${airportLabel(city)}`}
                flights={arrivals}
                kind="arrival"
                emptyLabel={query ? 'Aucune arrivée ne correspond à votre recherche.' : 'Aucune arrivée programmée aujourd’hui.'}
                isMobile={isMobile}
              />
            </>
          )}

          <AirportServices isMobile={isMobile} />

          <footer style={s.footer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/air.png" alt="Air Congo" style={s.footerLogo} />
            <nav style={s.footerNav}>
              <Link href="/conditions" className="fl-footer-link" style={s.footerLink}>Conditions d'utilisation</Link>
              <Link href="/confidentialite" className="fl-footer-link" style={s.footerLink}>Confidentialité</Link>
              <Link href="/cookies" className="fl-footer-link" style={s.footerLink}>Cookies</Link>
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
  { href: '/vols/departs', title: 'Départs & arrivées', desc: 'Suivez les horaires en temps réel sur le portail officiel' },
  { href: '/guide', title: 'Guide du voyageur', desc: 'Préparez visa, vaccination fièvre jaune et douanes' },
  { href: '/guide/securite-bagages', title: 'Sécurité bagages', desc: 'Vérifiez les règles, objets interdits et franchises' },
  { href: '/stationnement-transport', title: 'Stationnement & transport', desc: 'Trouvez parking, taxis agréés et navettes' },
  { href: '/boutiques-restaurants', title: 'Boutiques & restaurants', desc: 'Repérez change, duty free et salons VIP' },
  { href: '/contact', title: 'Contact', desc: "Joignez l'aéroport (RVA) directement" },
];

/** Liens vers le portail officiel de l'Aéroport International de Kinshasa (FIH). */
function AirportServices({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={s.servicesWrap}>
      <h2 style={s.servicesTitle}>Préparez votre passage à l'aéroport</h2>

      <a
        style={isMobile ? { ...s.siteBanner, ...s.siteBannerMobile } : s.siteBanner}
        href={AIRPORT_SITE}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span style={s.siteIcon}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fih-logo.png" alt="Logo RVA, Aéroport de Kinshasa" width={32} height={32} style={s.siteLogo} />
        </span>
        <span style={s.siteTexts}>
          <span style={s.siteName}>Consultez le site officiel de l'Aéroport International de Kinshasa (FIH)</span>
          <span style={s.siteUrl}>fih-rva.com · Régie des Voies Aériennes</span>
        </span>
        <ExternalIcon />
      </a>

      <div style={isMobile ? { ...s.linksGrid, ...s.linksGridMobile } : s.linksGrid}>
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
      caption = `Ouvre à ${fmtTime(openAt)}`;
      countPrefix = 'ouvre dans';
      countValue = formatCountdown(openAt - now);
      break;
    case 'open':
      title = 'Enregistrement ouvert';
      caption = `Présentez-vous avant ${fmtTime(closeAt)}`;
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

/** Sélecteur d'aéroport — premier écran tant que le visiteur n'a pas choisi. */
function CityPicker({ onPick, isMobile }: { onPick: (code: string) => void; isMobile: boolean }) {
  const domestic = AIRPORTS.filter((a) => a.domestic);
  const international = AIRPORTS.filter((a) => !a.domestic);

  const group = (label: string, list: typeof domestic) => (
    <section style={s.pickerSection}>
      <h3 style={s.pickerGroupTitle}>{label}</h3>
      <div style={isMobile ? { ...s.pickerGrid, ...s.pickerGridMobile } : s.pickerGrid}>
        {list.map((a) => (
          <button
            key={a.code}
            type="button"
            className="fl-city"
            style={isMobile ? { ...s.cityBtn, ...s.cityBtnMobile } : s.cityBtn}
            onClick={() => onPick(a.code)}
          >
            <span style={s.cityName}>{a.city}</span>
            <span style={s.cityCode}>{a.code}</span>
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <div style={s.pickerWrap}>
      <h2 style={isMobile ? { ...s.pickerTitle, fontSize: 26 } : s.pickerTitle}>Où êtes-vous ?</h2>
      <p style={s.pickerText}>
        Choisissez votre aéroport pour voir les vols au départ et à l’arrivée de votre ville.
      </p>
      {group('RD Congo', domestic)}
      {group('International', international)}
    </div>
  );
}

/** Tableau « Départs » ou « Arrivées » pour l'aéroport choisi. */
function FlightBoard({
  title,
  subtitle,
  flights,
  kind,
  emptyLabel,
  isMobile,
}: {
  title: string;
  subtitle: string;
  flights: PublicFlight[];
  kind: 'departure' | 'arrival';
  emptyLabel: string;
  isMobile: boolean;
}) {
  return (
    <section style={s.boardWrap}>
      <div style={s.boardHead}>
        <h2 style={s.boardTitle}>{title}</h2>
        <span style={s.boardCount}>{flights.length}</span>
      </div>
      <p style={s.boardSubtitle}>{subtitle}</p>
      {flights.length === 0 ? (
        <div style={s.empty}>{emptyLabel}</div>
      ) : (
        <ul style={s.list}>
          {flights.map((f) => (
            <FlightCard
              key={`${kind}-${f.flight_number}-${f.departure_time ?? f.date}`}
              flight={f}
              kind={kind}
              isMobile={isMobile}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function FlightCard({
  flight,
  kind,
  isMobile,
}: {
  flight: PublicFlight;
  kind: 'departure' | 'arrival';
  isMobile: boolean;
}) {
  const isDeparture = kind === 'departure';
  const kindLabel = isDeparture ? 'Départ' : 'Arrivée';
  const mainTime = isDeparture ? flight.departure_time : flight.arrival_time;

  // Retard estimé : heure prévue dépassée et vol ni fermé ni annulé.
  const delayed =
    mainTime != null &&
    (flight.status === 'scheduled' || flight.status === 'boarding') &&
    new Date(mainTime).getTime() < Date.now();

  const pill = STATUS_PILL[flight.status];

  return (
    <li className="fl-card" style={isMobile ? { ...s.card, ...s.cardMobile } : s.card}>
      <div style={s.cardMain}>
        <div style={s.timeBlock}>
          <span style={s.time}>{timeOf(mainTime)}</span>
          <span style={s.kindLabel}>{kindLabel}</span>
        </div>
        <span style={s.vSep} aria-hidden />
        <div style={s.cardInfo}>
          <div style={s.flightNumber}>{flight.flight_number}</div>
          <div style={s.route}>{formatRoute(flight)}</div>
        </div>
        <div style={isMobile ? { ...s.statusBlock, ...s.statusBlockMobile } : s.statusBlock}>
          <span style={{ ...s.statusPill, background: pill.bg, color: pill.fg }}>
            {FLIGHT_STATUS_LABEL[flight.status]}
          </span>
          {delayed ? <span style={{ ...s.statusPill, ...s.delayPill }}>Retardé</span> : null}
        </div>
      </div>

      {isDeparture && mainTime && flight.status !== 'cancelled' ? (
        <CheckInBadge departureTime={mainTime} />
      ) : null}
    </li>
  );
}

// Carte blanche (design Wise) : fond blanc, radius 16, bordure fine — jamais d'ombre par défaut.
const whiteCard: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-neutral)',
  borderRadius: 16,
};

// Tuile teintée (design Wise) : fond vert très pâle, radius 24 — ni bordure, ni ombre, ni flou.
const tintedTile: CSSProperties = {
  background: 'var(--bg-neutral)',
  borderRadius: 24,
};

// En-tête clair sticky : fond blanc, simple filet inférieur.
const headerLight: CSSProperties = {
  background: 'var(--bg-screen)',
  borderBottom: '1px solid var(--border-neutral)',
  color: 'var(--content-primary)',
};

const s: Record<string, CSSProperties> = {
  pageWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-screen)' },
  stickyHeader: {
    ...headerLight,
    position: 'sticky' as const,
    top: 0,
    zIndex: 1050,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 14,
    padding: '14px 32px',
    minHeight: 76,
  },
  stickyHeaderMobile: {
    ...headerLight,
    position: 'sticky' as const,
    top: 0,
    zIndex: 1050,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch' as const,
    gap: 12,
    padding: '12px 16px',
  },
  shell: { flex: 1, display: 'flex', justifyContent: 'center', padding: '28px 20px 48px' },
  shellMobile: { padding: '18px 12px 32px' },
  container: { width: '100%', maxWidth: 980, display: 'flex', flexDirection: 'column', gap: 20 },

  // ── Sélecteur d'aéroport ────────────────────────────────────
  changeCityBtn: {
    background: 'transparent',
    border: '1px solid var(--border-neutral)',
    borderRadius: 9999,
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--content-primary)',
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
  },
  pickerWrap: { ...tintedTile, padding: '28px 24px', display: 'flex', flexDirection: 'column' as const, gap: 8 },
  pickerTitle: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: 32,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    color: 'var(--content-primary)',
  },
  pickerText: { margin: 0, color: 'var(--content-secondary)', fontSize: 15, lineHeight: 1.5, maxWidth: 520 },
  pickerSection: { marginTop: 18 },
  pickerGroupTitle: {
    margin: '0 0 10px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--content-tertiary)',
  },
  pickerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 },
  pickerGridMobile: { gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 8 },
  cityBtn: {
    ...whiteCard,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '13px 14px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    minWidth: 0,
  },
  // Sur mobile, le code IATA à côté du nom laissait trop peu de place : les
  // villes longues (Lubumbashi, Dar es Salaam…) étaient tronquées. On empile.
  cityBtnMobile: {
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
    gap: 2,
    padding: '11px 12px',
  },
  cityName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--content-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cityCode: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'var(--content-tertiary)',
    flexShrink: 0,
  },

  // ── Tableaux Départs / Arrivées ─────────────────────────────
  boardWrap: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  boardHead: { display: 'flex', alignItems: 'center', gap: 10 },
  boardTitle: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: '-0.02em',
    color: 'var(--content-primary)',
  },
  boardCount: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 26,
    height: 24,
    padding: '0 8px',
    borderRadius: 9999,
    background: 'var(--bg-neutral)',
    color: 'var(--content-secondary)',
    fontSize: 13,
    fontWeight: 700,
  },
  boardSubtitle: { margin: '0 0 8px', color: 'var(--content-secondary)', fontSize: 14 },

  brandBlock: { display: 'flex', alignItems: 'center', gap: 14 },
  logo: { height: 44, objectFit: 'contain' as const, flexShrink: 0 },
  footerLogo: { height: 36, objectFit: 'contain' as const, opacity: 0.9, display: 'block', margin: '0 auto 6px' },
  title: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: 30,
    fontWeight: 400,
    lineHeight: 0.95,
    letterSpacing: 0,
    color: 'var(--content-primary)',
  },
  titleMobile: { fontSize: 24 },
  subtitle: { margin: '4px 0 0', color: 'var(--content-secondary)', fontSize: 13.5, fontWeight: 500 },
  controls: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  controlsMobile: { flexDirection: 'column', alignItems: 'stretch', width: '100%' },
  search: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-neutral)',
    borderRadius: 9999,
    padding: '12px 20px',
    color: 'var(--content-primary)',
    fontSize: 15,
    minWidth: 260,
  },
  searchMobile: { minWidth: 0, width: '100%' },

  error: {
    background: 'var(--negative-bg)',
    color: 'var(--negative)',
    borderRadius: 16,
    padding: '14px 20px',
    fontWeight: 600,
  },

  loader: {
    ...tintedTile,
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    color: 'var(--content-secondary)',
    fontSize: 15,
  },
  spinner: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '3px solid var(--border-neutral)',
    borderTopColor: 'var(--interactive-primary)',
    animation: 'spin 0.8s linear infinite',
  },
  empty: { ...tintedTile, padding: '40px 20px', textAlign: 'center', color: 'var(--content-secondary)', fontSize: 15 },

  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    ...whiteCard,
    padding: '18px 24px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardMobile: { padding: '16px 16px' },
  cardMain: { display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' },
  timeBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 80 },
  time: {
    fontSize: 28,
    fontWeight: 600,
    lineHeight: 1.1,
    color: '#0E0F0C',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.03em',
  },
  kindLabel: {
    color: 'var(--content-tertiary)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  vSep: { width: 1, alignSelf: 'stretch', background: 'var(--border-neutral)', flexShrink: 0 },
  cardInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  flightNumber: { fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', color: '#0E0F0C', overflowWrap: 'break-word' },
  route: { color: 'var(--content-secondary)', fontSize: 14.5, fontWeight: 500, overflowWrap: 'break-word' },
  statusBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  statusBlockMobile: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: 9999,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
  },
  delayPill: { background: 'var(--warning-bg)', color: 'var(--warning-content)' },
  checkin: {
    width: '100%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
    rowGap: 5,
    flexWrap: 'wrap',
    marginTop: 10,
    paddingTop: 12,
    borderTop: '1px solid var(--border-neutral)',
  },
  checkinLeft: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' },
  checkinDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  checkinTitle: { fontSize: 13.5, fontWeight: 600, color: 'var(--content-primary)', letterSpacing: '-0.01em' },
  checkinSep: { width: 1, height: 12, background: 'var(--border-neutral)', flexShrink: 0 },
  checkinCaption: { fontSize: 13, fontWeight: 500, color: 'var(--content-secondary)', fontVariantNumeric: 'tabular-nums' },
  checkinCount: { display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 },
  checkinCountPrefix: { fontSize: 12.5, fontWeight: 500, color: 'var(--content-secondary)' },
  checkinCountValue: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--content-primary)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 0.2,
  },

  footer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 20, borderTop: '1px solid var(--border-neutral)' },
  footerNav: { display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' },
  footerLink: { color: 'var(--content-secondary)', fontSize: 13, fontWeight: 500 },
  footerText: { color: 'var(--content-tertiary)', fontSize: 12, textAlign: 'center', margin: 0 },

  servicesWrap: { display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 },
  servicesTitle: {
    margin: '4px 0',
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    color: 'var(--content-primary)',
  },
  siteBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    padding: '18px 22px',
    color: 'var(--brand-forest)',
    background: 'var(--brand-green)',
  },
  siteBannerMobile: { padding: '16px 16px', gap: 12 },
  siteIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 48,
    height: 48,
    borderRadius: 9999,
    background: '#ffffff',
    flexShrink: 0,
    overflow: 'hidden',
  },
  siteLogo: { width: 32, height: 32, objectFit: 'contain' },
  siteTexts: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  siteName: { fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', overflowWrap: 'break-word' },
  siteUrl: { fontSize: 13, color: 'rgba(22, 51, 0, 0.75)', fontWeight: 500, overflowWrap: 'break-word' },

  linksGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 },
  linksGridMobile: { gridTemplateColumns: '1fr' },
  linkCard: {
    ...whiteCard,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '16px 18px',
    color: 'var(--content-primary)',
  },
  linkTexts: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  linkTitle: { fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.01em' },
  linkDesc: { fontSize: 12.5, color: 'var(--content-secondary)', fontWeight: 500 },
};
