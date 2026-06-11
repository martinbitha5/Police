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
import { glass, shared } from '@/components/theme';
import { IconSearch, IconBag, IconAlert, IconCheck } from '@/components/icons';

const TAG_RE = /^\d{10}$/;

export default function TrackingPage() {
  const { t }    = useLang();
  const isMobile = useIsMobile();
  const [pnr, setPnr] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState('');
  const [tag, setTag] = useState('');
  const [result, setResult] = useState<BaggageTrackingResult | null>(null);
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
        <h1 style={isMobile ? { ...s.title, fontSize: 30 } : s.title}>{t.home.title}</h1>

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
            <span style={s.muted}>{t.home.hint}</span>
            <button style={s.cta} type="submit" disabled={busy}>
              {busy ? t.home.submitting : t.home.submit}
            </button>
          </div>

          <p style={s.helper}>
            <span style={{ color: 'var(--danger)' }}>*</span> {t.home.helperRequired}
          </p>
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
            <span style={{ display: 'inline-flex', color: 'var(--muted)' }}><IconSearch size={22} /></span>
            <p style={{ margin: 0 }}>{result.message || t.home.notFound}</p>
          </div>
        ) : null}

        {result?.status === 'found'
          ? result.passengers.map((p, i) => <PassengerCard key={`${p.pnr}-${i}`} pax={p} />)
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
        {required ? <span style={{ color: 'var(--danger)' }}> *</span> : null}
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
        <Link href="/support" style={s.helpBtnPrimary}>
          {t.help.contact}
        </Link>
        <Link href="/support" style={s.helpBtnGhost}>
          {t.help.faq}
        </Link>
      </div>
    </section>
  );
}

function PassengerCard({ pax }: { pax: TrackedPassenger }) {
  const { t } = useLang();
  const [openTag, setOpenTag] = useState<string | null>(null);
  // Statut de réclamation forcé localement après envoi, pour que l'étiquette
  // passe à « Problème signalé » immédiatement sans relancer la recherche.
  const [claimed, setClaimed] = useState<Record<string, DisputeStatus>>({});
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
        <div style={{ ...s.summary, color: allLoaded ? '#4ade80' : '#fbbf24' }}>
          {pax.confirmedBaggageCount}/{pax.declaredBaggageCount}
          <span style={s.summaryLabel}>{t.home.summaryLoaded}</span>
        </div>
      </div>
      <ul style={s.bagList}>
        {pax.bags.map((b) => {
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
  const statusStyle =
    bag.status === 'rush'
      ? s.badgeRush
      : bag.status === 'loaded'
        ? s.badgeLoaded
        : bag.status === 'registered'
          ? s.badgeRegistered
          : s.badgePending;
  const claimLabel =
    claimStatus === 'resolved'
      ? t.claim.statusResolved
      : claimStatus === 'investigating'
        ? t.claim.statusInvestigating
        : claimStatus === 'open'
          ? t.claim.statusOpen
          : null;
  const claimStyle =
    claimStatus === 'resolved' ? s.claimBadgeResolved : s.claimBadgeOpen;
  return (
    <li style={s.bagRow}>
      <span style={s.tag}><IconBag size={15} /> {bag.tagNumber}</span>
      <span style={{ ...s.badge, ...statusStyle }}>{statusLabel}</span>
      {claimLabel ? (
        <span style={{ ...s.badge, ...claimStyle }}>
          {claimStatus === 'resolved' ? <IconCheck size={12} /> : <IconAlert size={12} />} {claimLabel}
        </span>
      ) : null}
      {bag.scannedAt ? (
        <span style={s.scannedAt}>{new Date(bag.scannedAt).toLocaleString('fr-FR')}</span>
      ) : null}
      {claimStatus === 'resolved' ? null : (
        <button type="button" style={s.reportBtn} onClick={onToggle}>
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
        <button type="button" style={s.claimCancel} onClick={onDone} disabled={busy}>
          {t.claim.cancel}
        </button>
        <button type="button" style={s.claimSubmit} onClick={submit} disabled={busy}>
          {busy ? t.claim.submitting : t.claim.submit}
        </button>
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  title: { margin: '20px 0 8px', fontSize: 56, fontWeight: 800, letterSpacing: 1, textShadow: '0 4px 24px rgba(0,0,0,0.5)' },

  panel: { ...glass, borderRadius: 16, padding: 26, boxShadow: '0 30px 70px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', gap: 18 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  input: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid var(--glass-border)',
    borderRadius: 10,
    padding: '12px 14px',
    color: 'var(--text)',
    fontSize: 15,
    colorScheme: 'dark',
  },

  actionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 },
  muted: { color: 'var(--muted)', fontSize: 13 },
  cta: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 26px', fontWeight: 700, fontSize: 15, boxShadow: '0 10px 24px rgba(37,99,235,0.4)' },
  helper: { margin: 0, color: 'var(--muted)', fontSize: 13 },

  loader: { ...glass, borderRadius: 14, padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' },
  loaderText: { margin: 0, color: 'var(--muted)', fontSize: 15, fontWeight: 500 },
  spinner: { width: 38, height: 38, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.18)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', display: 'inline-block' },

  error: { ...glass, color: '#fca5a5', borderColor: 'rgba(220,38,38,0.5)', borderRadius: 12, padding: '14px 18px', margin: 0 },
  notFound: { ...glass, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: '18px 20px', color: 'var(--muted)' },

  resultCard: { ...glass, borderRadius: 14, padding: 20, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' },
  resultHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 },
  paxName: { fontSize: 20, fontWeight: 700 },
  paxMeta: { color: 'var(--muted)', fontSize: 13, marginTop: 3 },
  summary: { fontSize: 28, fontWeight: 800, lineHeight: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  summaryLabel: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  bagList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  bagRow: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '10px 14px' },
  tag: { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 15 },
  badge: { fontSize: 13, fontWeight: 600, borderRadius: 999, padding: '4px 12px' },
  badgeLoaded: { background: 'rgba(22,163,74,0.2)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.5)' },
  badgePending: { background: 'rgba(148,163,184,0.18)', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.4)' },
  badgeRegistered: { background: 'rgba(37,99,235,0.18)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.5)' },
  badgeRush: { background: 'rgba(217,119,6,0.2)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.5)' },
  claimBadgeOpen: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(220,38,38,0.16)',
    color: '#fca5a5',
    border: '1px solid rgba(220,38,38,0.45)',
  },
  claimBadgeResolved: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(37,99,235,0.16)',
    color: '#93c5fd',
    border: '1px solid rgba(37,99,235,0.45)',
  },
  scannedAt: { marginLeft: 'auto', color: 'var(--muted)', fontSize: 12 },
  reportBtn: {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'transparent',
    border: '1px solid var(--glass-border)',
    color: 'var(--muted)',
    borderRadius: 999,
    padding: '5px 12px',
    fontSize: 13,
    fontWeight: 600,
  },

  claimWrap: { listStyle: 'none', margin: 0, padding: 0 },
  claimForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    borderRadius: 12,
    padding: 16,
  },
  claimTitle: { fontSize: 15, fontWeight: 700, marginBottom: 2 },
  claimLabel: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginTop: 4 },
  claimErr: {
    color: '#fca5a5',
    background: 'rgba(220,38,38,0.12)',
    border: '1px solid rgba(220,38,38,0.4)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
  },
  claimActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 },
  claimCancel: {
    background: 'rgba(255,255,255,0.07)',
    color: 'var(--text)',
    border: '1px solid var(--glass-border)',
    borderRadius: 10,
    padding: '9px 16px',
    fontWeight: 600,
    fontSize: 14,
  },
  claimSubmit: {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '9px 18px',
    fontWeight: 700,
    fontSize: 14,
  },
  claimDone: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(22,163,74,0.14)',
    border: '1px solid rgba(22,163,74,0.45)',
    color: '#4ade80',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 14,
    fontWeight: 600,
  },

  helpCard: { ...glass, borderRadius: 14, padding: 24, marginTop: 6 },
  helpTitle: { margin: '0 0 8px', fontSize: 20, fontWeight: 700 },
  helpText: { margin: '0 0 16px', color: 'var(--muted)', lineHeight: 1.5, maxWidth: 720 },
  helpBtns: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  helpBtnPrimary: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 600 },
  helpBtnGhost: { background: 'rgba(255,255,255,0.07)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '11px 20px', fontWeight: 600 },
};
