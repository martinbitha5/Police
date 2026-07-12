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

// Statut bagage / réclamation : un point coloré comme seule touche de couleur,
// le libellé reste en texte neutre (pas de pastille pastel).
const STATUS_DOT: Record<string, string> = {
  rush: '#b45309',
  loaded: '#15803d',
  registered: '#1e4ed8',
  pending: '#8b939e',
};
const CLAIM_DOT: Record<string, string> = {
  open: '#b91c1c',
  investigating: '#b45309',
  resolved: '#15803d',
};

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
        <div style={{ ...s.summary, color: allLoaded ? 'var(--success)' : 'var(--text)' }}>
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
  const claimColor = claimStatus ? CLAIM_DOT[claimStatus] : undefined;
  return (
    <li style={s.bagRow}>
      <span style={s.tag}><IconBag size={15} /> {bag.tagNumber}</span>
      <span style={s.statusText}>
        <span style={{ ...s.dot, background: STATUS_DOT[bag.status] }} />
        {statusLabel}
      </span>
      {claimLabel ? (
        <span style={{ ...s.claimText, color: claimColor }}>
          {claimStatus === 'resolved' ? <IconCheck size={13} /> : <IconAlert size={13} />} {claimLabel}
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
  title: { margin: '20px 0 8px', fontSize: 38, fontWeight: 800, letterSpacing: -0.8, color: 'var(--text)' },

  panel: { ...glass, borderRadius: 14, padding: 26, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 18 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  input: {
    background: 'var(--surface)',
    border: '1px solid var(--border-strong)',
    borderRadius: 8,
    padding: '11px 14px',
    color: 'var(--text)',
    fontSize: 15,
  },

  actionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 },
  muted: { color: 'var(--muted)', fontSize: 13 },
  cta: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 9, padding: '13px 28px', fontWeight: 700, fontSize: 15 },
  helper: { margin: 0, color: 'var(--muted)', fontSize: 13 },

  loader: { ...glass, borderRadius: 12, padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-sm)' },
  loaderText: { margin: 0, color: 'var(--muted)', fontSize: 15, fontWeight: 500 },
  spinner: { width: 38, height: 38, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', display: 'inline-block' },

  error: { background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid #f1c5c5', borderRadius: 10, padding: '14px 18px', margin: 0, fontWeight: 600 },
  notFound: { ...glass, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: '18px 20px', color: 'var(--muted)', boxShadow: 'var(--shadow-sm)' },

  resultCard: { ...glass, borderRadius: 12, padding: 22, boxShadow: 'var(--shadow-sm)' },
  resultHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 },
  paxName: { fontSize: 20, fontWeight: 700, color: 'var(--text)' },
  paxMeta: { color: 'var(--muted)', fontSize: 13, marginTop: 3 },
  summary: { fontSize: 28, fontWeight: 800, lineHeight: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontVariantNumeric: 'tabular-nums' },
  summaryLabel: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  bagList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  bagRow: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderTop: '1px solid var(--border)', padding: '12px 2px' },
  tag: { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 15, color: 'var(--text)', minWidth: 128 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  statusText: { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' },
  claimText: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600 },
  scannedAt: { marginLeft: 'auto', color: 'var(--faint)', fontSize: 12, fontVariantNumeric: 'tabular-nums' },
  reportBtn: {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    color: 'var(--muted)',
    padding: '4px 2px',
    fontSize: 13,
    fontWeight: 600,
  },

  claimWrap: { listStyle: 'none', margin: 0, padding: 0 },
  claimForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 18,
    boxShadow: 'var(--shadow-sm)',
  },
  claimTitle: { fontSize: 15, fontWeight: 700, marginBottom: 2, color: 'var(--text)' },
  claimLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 4 },
  claimErr: {
    color: 'var(--danger)',
    background: 'var(--danger-soft)',
    border: '1px solid #f1c5c5',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
  },
  claimActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 },
  claimCancel: {
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
    borderRadius: 8,
    padding: '9px 16px',
    fontWeight: 600,
    fontSize: 14,
  },
  claimSubmit: {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '9px 18px',
    fontWeight: 700,
    fontSize: 14,
  },
  claimDone: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--success-soft)',
    border: '1px solid #bbe0c8',
    color: 'var(--success)',
    borderRadius: 10,
    padding: '14px 16px',
    fontSize: 14,
    fontWeight: 600,
  },

  helpCard: { ...glass, borderRadius: 12, padding: 26, marginTop: 6, boxShadow: 'var(--shadow-sm)' },
  helpTitle: { margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--text)' },
  helpText: { margin: '0 0 16px', color: 'var(--muted)', lineHeight: 1.6, maxWidth: 720 },
  helpBtns: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  helpBtnPrimary: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontWeight: 600 },
  helpBtnGhost: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '11px 20px', fontWeight: 600 },
};
