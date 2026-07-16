'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import type {
  BaggageTrackingResult,
  TrackedPassenger,
  TrackedBag,
  ClaimCategory,
  DisputeStatus,
} from '@police/shared';
import { useLang } from '@/i18n/LanguageProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { glass, tile, shared } from '@/components/theme';
import { IconSearch, IconBag, IconAlert, IconCheck } from '@/components/icons';

const TAG_RE = /^\d{10}$/;

// Statut bagage : pastilles pilule Wise — trouvé/livré en vert, en cours en
// jaune, problème en rouge, attente en neutre.
const STATUS_PILL: Record<string, { bg: string; fg: string }> = {
  rush: { bg: 'var(--negative-bg)', fg: 'var(--negative)' },
  loaded: { bg: 'var(--positive-bg)', fg: 'var(--positive)' },
  registered: { bg: 'var(--warning-bg)', fg: 'var(--warning-content)' },
  pending: { bg: 'var(--bg-neutral)', fg: 'var(--content-secondary)' },
};
const CLAIM_PILL: Record<string, { bg: string; fg: string }> = {
  open: { bg: 'var(--negative-bg)', fg: 'var(--negative)' },
  investigating: { bg: 'var(--warning-bg)', fg: 'var(--warning-content)' },
  resolved: { bg: 'var(--positive-bg)', fg: 'var(--positive)' },
};

// Étapes du parcours bagage — timeline claire, points vert forêt.
const STEP_ORDER = ['pending', 'registered', 'loaded'] as const;

export default function TrackingPage() {
  const { t }    = useLang();
  const isMobile = useIsMobile();
  const [pnr, setPnr] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState('');
  const [tag, setTag] = useState('');
  const [result, setResult] = useState<BaggageTrackingResult | null>(null);
  const [searchedTag, setSearchedTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Le passager peut suivre par étiquette (prioritaire) ou par PNR.
    const cleanTag = tag.trim();
    const query = cleanTag || pnr.trim().toUpperCase();
    if (!query) {
      setError(t.home.errNoQuery);
      return;
    }
    if (cleanTag && !TAG_RE.test(cleanTag)) {
      setError(t.home.errTagLen);
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setSearchedTag(cleanTag);
    // Durée minimale d'affichage du loader pour que l'animation reste visible.
    const minDelay = new Promise((r) => setTimeout(r, 900));
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, flightNumber: flightNumber.trim(), date }),
      });
      const data = await res.json();
      await minDelay;
      if (!res.ok) setError(data.error ?? t.home.errSearch);
      else setResult(data as BaggageTrackingResult);
    } catch {
      await minDelay;
      setError(t.home.errConn);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={shared.shell}>
      <Header />
      <Breadcrumb current={t.breadcrumb.tracking} />

      <main style={isMobile ? { ...shared.main, ...shared.mainMobile } : shared.main}>
        {/* Héros Wise : H1 display énorme + sous-titre sobre */}
        <div style={s.hero}>
          <h1 style={isMobile ? { ...s.title, fontSize: 'clamp(2.25rem, 9vw, 3rem)' } : s.title}>{t.home.title}</h1>
          <p style={s.subtitle}>{t.home.hint}</p>
        </div>

        <form onSubmit={onSubmit} style={s.panel}>
          <div style={isMobile ? { ...s.grid, gridTemplateColumns: '1fr' } : s.grid}>
            <Field label={t.home.fieldPnr} required>
              <input
                style={s.input}
                placeholder={t.home.fieldPnrPh}
                value={pnr}
                onChange={(e) => setPnr(e.target.value)}
                autoCapitalize="characters"
              />
            </Field>
            <Field label={t.home.fieldFlight}>
              <input
                style={s.input}
                placeholder={t.home.fieldFlightPh}
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                autoCapitalize="characters"
              />
            </Field>
            <Field label={t.home.fieldDate}>
              <input style={s.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t.home.fieldTag}>
              <input
                style={s.input}
                placeholder={t.home.fieldTagPh}
                inputMode="numeric"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </Field>
          </div>

          <div style={s.actionRow}>
            <p style={s.helper}>
              <span style={{ color: 'var(--negative)' }}>*</span> {t.home.helperRequired}
            </p>
            <button className="btn-primary" style={s.cta} type="submit" disabled={busy}>
              {busy ? t.home.submitting : t.home.submit}
            </button>
          </div>
        </form>

        {error ? <p style={s.error}>{error}</p> : null}

        {busy ? (
          <div style={s.loader}>
            <span style={s.spinner} />
            <p style={s.loaderText}>{t.home.searching}</p>
          </div>
        ) : null}

        {!busy && result?.status === 'not_found' ? (
          <div style={s.notFound}>
            <span style={s.iconCircle}><IconSearch size={20} /></span>
            <p style={{ margin: 0 }}>{result.message || t.home.notFound}</p>
          </div>
        ) : null}

        {result?.status === 'found'
          ? result.passengers.map((p, i) => (
              <PassengerCard key={`${p.pnr}-${i}`} pax={p} tagFilter={searchedTag || undefined} />
            ))
          : null}

        <HelpCard />
      </main>

      <Footer />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={s.field}>
      <span style={s.fieldLabel}>
        {label}
        {required ? <span style={{ color: 'var(--negative)' }}> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function HelpCard() {
  const { t } = useLang();
  return (
    <section style={s.helpCard}>
      <h2 style={s.helpTitle}>{t.help.title}</h2>
      <p style={s.helpText}>{t.help.text}</p>
      <div style={s.helpBtns}>
        <Link href="/support" className="btn-primary">
          {t.help.contact}
        </Link>
        <Link href="/support" className="link-underline" style={{ alignSelf: 'center' }}>
          {t.help.faq}
        </Link>
      </div>
    </section>
  );
}

function PassengerCard({ pax, tagFilter }: { pax: TrackedPassenger; tagFilter?: string }) {
  const { t } = useLang();
  const [openTag, setOpenTag] = useState<string | null>(null);
  // Statut de réclamation forcé localement après envoi, pour que l'étiquette
  // passe à « Problème signalé » immédiatement sans relancer la recherche.
  const [claimed, setClaimed] = useState<Record<string, DisputeStatus>>({});
  const visibleBags = tagFilter ? pax.bags.filter((b) => b.tagNumber === tagFilter) : pax.bags;
  const allLoaded = pax.declaredBaggageCount > 0 && pax.confirmedBaggageCount >= pax.declaredBaggageCount;
  return (
    <section style={s.resultCard}>
      <div style={s.resultHead}>
        <div>
          <div style={s.paxName}>{pax.passengerName}</div>
          <div style={s.paxMeta}>
            {pax.flightNumber} · {pax.route} · {t.home.pnrLabel} {pax.pnr}
          </div>
          <div style={s.paxMeta}>
            {pax.flightDate}
            {pax.departureTime
              ? ` · ${new Date(pax.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </div>
        </div>
        <div style={{ ...s.summary, color: allLoaded ? 'var(--positive)' : 'var(--content-primary)' }}>
          {pax.confirmedBaggageCount}/{pax.declaredBaggageCount}
          <span style={s.summaryLabel}>{t.home.summaryLoaded}</span>
        </div>
      </div>
      <ul style={s.bagList}>
        {visibleBags.map((b) => {
          const claimStatus = claimed[b.tagNumber] ?? b.claimStatus;
          return (
            <Fragment key={b.tagNumber}>
              <BagRow
                bag={b}
                claimStatus={claimStatus}
                open={openTag === b.tagNumber}
                onToggle={() => setOpenTag(openTag === b.tagNumber ? null : b.tagNumber)}
              />
              {openTag === b.tagNumber ? (
                <li style={s.claimWrap}>
                  <ClaimForm
                    tagNumber={b.tagNumber}
                    onDone={() => setOpenTag(null)}
                    onSubmitted={() => setClaimed((m) => ({ ...m, [b.tagNumber]: 'open' }))}
                  />
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ul>
    </section>
  );
}

// Timeline d'étapes : points vert forêt reliés, remplis jusqu'à l'étape atteinte.
function StepDots({ status }: { status: TrackedBag['status'] }) {
  const idx = STEP_ORDER.indexOf(status as (typeof STEP_ORDER)[number]);
  if (idx < 0) return null; // « rush » sort du parcours nominal
  return (
    <span style={s.steps} aria-hidden="true">
      {STEP_ORDER.map((st, i) => (
        <Fragment key={st}>
          {i > 0 ? (
            <span style={{ ...s.stepBar, background: i <= idx ? 'var(--interactive-primary)' : 'var(--border-neutral)' }} />
          ) : null}
          <span
            style={{
              ...s.stepDot,
              background: i <= idx ? 'var(--interactive-primary)' : 'var(--bg-elevated)',
              boxShadow: i <= idx ? 'none' : 'inset 0 0 0 1.5px var(--border-neutral)',
            }}
          />
        </Fragment>
      ))}
    </span>
  );
}

function BagRow({
  bag,
  claimStatus,
  open,
  onToggle,
}: {
  bag: TrackedBag;
  claimStatus: DisputeStatus | null;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useLang();
  const statusLabel =
    bag.status === 'rush'
      ? t.home.badgeRush
      : bag.status === 'loaded'
        ? t.home.badgeLoaded
        : bag.status === 'registered'
          ? t.home.badgeRegistered
          : t.home.badgePending;
  const claimLabel =
    claimStatus === 'resolved'
      ? t.claim.statusResolved
      : claimStatus === 'investigating'
        ? t.claim.statusInvestigating
        : claimStatus === 'open'
          ? t.claim.statusOpen
          : null;
  const statusPill = STATUS_PILL[bag.status] ?? STATUS_PILL.pending;
  const claimPill = claimStatus ? CLAIM_PILL[claimStatus] : null;
  return (
    <li style={s.bagRow}>
      <span style={s.tag}><IconBag size={15} /> {bag.tagNumber}</span>
      <span style={{ ...s.pill, background: statusPill.bg, color: statusPill.fg }}>{statusLabel}</span>
      <StepDots status={bag.status} />
      {claimLabel && claimPill ? (
        <span style={{ ...s.pill, background: claimPill.bg, color: claimPill.fg }}>
          {claimStatus === 'resolved' ? <IconCheck size={13} /> : <IconAlert size={13} />} {claimLabel}
        </span>
      ) : null}
      {bag.scannedAt ? (
        <span style={s.scannedAt}>{new Date(bag.scannedAt).toLocaleString('fr-FR')}</span>
      ) : null}
      {claimStatus === 'resolved' ? null : (
        <button type="button" className="btn-secondary" style={s.reportBtn} onClick={onToggle}>
          <IconAlert size={14} /> {open ? t.claim.cancel : t.claim.open}
        </button>
      )}
    </li>
  );
}

function ClaimForm({
  tagNumber,
  onDone,
  onSubmitted,
}: {
  tagNumber: string;
  onDone: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useLang();
  const cats: { key: ClaimCategory; label: string }[] = [
    { key: 'missing', label: t.claim.catMissing },
    { key: 'damaged', label: t.claim.catDamaged },
    { key: 'contents', label: t.claim.catContents },
    { key: 'delayed', label: t.claim.catDelayed },
    { key: 'other', label: t.claim.catOther },
  ];
  const [category, setCategory] = useState<ClaimCategory>('missing');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!message.trim()) {
      setErr(t.claim.errEmpty);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagNumber, category, message: message.trim(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'accepted') {
        setErr(data.message ?? t.claim.errSend);
        setBusy(false);
        return;
      }
      setDone(true);
      onSubmitted();
    } catch {
      setErr(t.claim.errSend);
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div style={s.claimDone}>
        <IconCheck size={18} /> <span>{t.claim.success}</span>
      </div>
    );
  }

  return (
    <div style={s.claimForm}>
      <div style={s.claimTitle}>{t.claim.title}</div>

      <label style={s.claimLabel}>{t.claim.category}</label>
      <select style={s.input} value={category} onChange={(e) => setCategory(e.target.value as ClaimCategory)}>
        {cats.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>

      <label style={s.claimLabel}>{t.claim.message}</label>
      <textarea
        style={{ ...s.input, minHeight: 84, resize: 'vertical', fontFamily: 'inherit' }}
        placeholder={t.claim.messagePh}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <label style={s.claimLabel}>{t.claim.contact}</label>
      <input
        style={s.input}
        placeholder={t.claim.contactPh}
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />

      {err ? <div style={s.claimErr}>{err}</div> : null}

      <div style={s.claimActions}>
        <button type="button" className="btn-secondary" style={s.claimCancel} onClick={onDone} disabled={busy}>
          {t.claim.cancel}
        </button>
        <button type="button" className="btn-primary" style={s.claimSubmit} onClick={submit} disabled={busy}>
          {busy ? t.claim.submitting : t.claim.submit}
        </button>
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  hero: { display: 'flex', flexDirection: 'column', gap: 14, margin: '28px 0 10px', maxWidth: 860 },
  title: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: 'clamp(2.625rem, 5vw + 1rem, 5rem)',
    lineHeight: 'var(--lh-display)',
    letterSpacing: 0,
    color: 'var(--content-primary)',
  },
  subtitle: { margin: 0, fontSize: 18, lineHeight: 1.5, color: 'var(--content-secondary)', maxWidth: 640 },

  panel: {
    ...glass,
    borderRadius: 'var(--radius-md)',
    padding: 26,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--content-primary)' },
  input: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-neutral)',
    borderRadius: 'var(--radius-sm)',
    padding: '13px 16px',
    color: 'var(--content-primary)',
    fontSize: 16,
  },

  actionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 },
  helper: { margin: 0, color: 'var(--content-secondary)', fontSize: 13, flex: '1 1 260px' },
  cta: { minWidth: 200 },

  loader: {
    ...glass,
    borderRadius: 'var(--radius-md)',
    padding: '36px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  loaderText: { margin: 0, color: 'var(--content-secondary)', fontSize: 15, fontWeight: 500 },
  spinner: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: '3px solid var(--bg-neutral)',
    borderTopColor: 'var(--interactive-primary)',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },

  error: {
    background: 'var(--negative-bg)',
    color: 'var(--negative)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px',
    margin: 0,
    fontWeight: 600,
  },
  notFound: {
    ...glass,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    borderRadius: 'var(--radius-md)',
    padding: '18px 20px',
    color: 'var(--content-secondary)',
  },
  iconCircle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-neutral)',
    color: 'var(--interactive-primary)',
    boxShadow: 'inset 0 0 0 1px var(--border-neutral)',
  },

  resultCard: { ...glass, borderRadius: 'var(--radius-md)', padding: 24 },
  resultHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 },
  paxName: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--content-primary)' },
  paxMeta: { color: 'var(--content-secondary)', fontSize: 13, marginTop: 3 },
  summary: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontVariantNumeric: 'tabular-nums',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--content-secondary)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bagList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  bagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    borderTop: '1px solid var(--border-neutral)',
    padding: '14px 2px',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 15,
    color: 'var(--content-primary)',
    minWidth: 128,
  },

  // Pastille pilule de statut (bagage et réclamation)
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 'var(--radius-full)',
    padding: '4px 12px',
    fontSize: 13,
    fontWeight: 600,
  },

  // Timeline d'étapes — points reliés, vert forêt
  steps: { display: 'inline-flex', alignItems: 'center' },
  stepDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  stepBar: { width: 22, height: 2, flexShrink: 0 },

  scannedAt: { marginLeft: 'auto', color: 'var(--content-tertiary)', fontSize: 12, fontVariantNumeric: 'tabular-nums' },
  reportBtn: { marginLeft: 'auto', fontSize: 13, padding: '6px 14px' },

  claimWrap: { listStyle: 'none', margin: 0, padding: 0 },
  claimForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: 'var(--bg-neutral)',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
  },
  claimTitle: { fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 2, color: 'var(--content-primary)' },
  claimLabel: { fontSize: 13, fontWeight: 600, color: 'var(--content-primary)', marginTop: 4 },
  claimErr: {
    color: 'var(--negative)',
    background: 'var(--negative-bg)',
    border: 'none',
    borderRadius: 'var(--radius-full)',
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
  },
  claimActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 },
  claimCancel: { fontSize: 14, padding: '9px 18px' },
  claimSubmit: { fontSize: 14, padding: '10px 20px' },
  claimDone: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--positive-bg)',
    border: 'none',
    color: 'var(--positive)',
    borderRadius: 'var(--radius-full)',
    padding: '14px 18px',
    fontSize: 14,
    fontWeight: 600,
  },

  // Carte d'aide : tuile teintée Wise, radius large
  helpCard: { ...tile, borderRadius: 'var(--radius-lg)', padding: '32px 24px', marginTop: 6 },
  helpTitle: {
    margin: '0 0 8px',
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    color: 'var(--content-primary)',
  },
  helpText: { margin: '0 0 18px', color: 'var(--content-secondary)', lineHeight: 1.5, maxWidth: 640 },
  helpBtns: { display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' },
};
