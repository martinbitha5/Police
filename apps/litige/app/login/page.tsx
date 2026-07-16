'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError('Identifiants incorrects. Vérifiez votre email et votre mot de passe.');
      setBusy(false);
      return;
    }
    router.replace('/litiges');
    router.refresh();
  }

  return (
    <div style={styles.page}>
      {/* Panneau gauche — identité (desktop) */}
      <aside className="lg-side">
        <SideArt />
        <div style={styles.sideTop}>
          <div style={styles.brandBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Litige Bagage" style={styles.brandLogo} />
            <span style={styles.brandName}>Litige Bagage</span>
          </div>
        </div>
        <div style={styles.sideBody}>
          <h2 style={styles.sideTitle}>Déclarez, suivez et résolvez vos litiges bagage.</h2>
          <p style={styles.sideText}>
            Retrouvez les bagages en anomalie et les réclamations passager au même endroit,
            avec enquête, notes internes et résolution horodatée.
          </p>
          <div style={styles.sidePoints}>
            <div style={styles.sidePoint}>
              <span style={styles.sideDot} />
              Litiges filtrés par jour, vol et statut
            </div>
            <div style={styles.sidePoint}>
              <span style={styles.sideDot} />
              Réclamations passager intégrées
            </div>
            <div style={styles.sidePoint}>
              <span style={styles.sideDot} />
              Rapport des litiges du jour en Excel
            </div>
          </div>
        </div>
        <div style={styles.sideFoot}>Litige Bagage · ATS Handling</div>
      </aside>

      {/* Panneau droit — formulaire */}
      <main style={styles.main}>
        <form onSubmit={onSubmit} className="lg-card">
          <h1 style={styles.title}>Connexion</h1>
          <p style={styles.subtitle}>Accédez à votre espace superviseur.</p>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              style={styles.input}
              type="email"
              placeholder="nom@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Mot de passe</label>
            <input
              id="password"
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <p style={styles.error}>{error}</p> : null}

          <button className="lg-btn" disabled={busy} type="submit">
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>

          <div style={styles.foot}>
            <Link href="/" style={styles.backLink}>Retour à l’accueil</Link>
          </div>
        </form>
      </main>
    </div>
  );
}

/** Filigrane de routes aériennes du panneau gauche — palette Wise. */
function SideArt() {
  return (
    <svg
      viewBox="0 0 440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <g fill="none" stroke="rgba(14,15,12,0.08)" strokeWidth="1">
        <line x1="0" y1="225" x2="440" y2="225" />
        <line x1="0" y1="450" x2="440" y2="450" />
        <line x1="0" y1="675" x2="440" y2="675" />
        <line x1="220" y1="0" x2="220" y2="900" />
      </g>
      <g fill="none" stroke="#163300" strokeWidth="1.4">
        <path d="M -20 700 Q 200 420 460 520" opacity="0.35" />
        <path d="M -30 520 Q 180 260 470 300" opacity="0.25" />
        <path d="M -10 860 Q 240 640 460 740" opacity="0.2" strokeDasharray="2 7" />
      </g>
      <g fill="#65CF21">
        <circle cx="80" cy="615" r="3" />
        <circle cx="330" cy="492" r="3.5" />
        <circle cx="160" cy="378" r="3" />
      </g>
      <circle cx="330" cy="492" r="9" fill="none" stroke="#65CF21" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--bg-screen)' },

  sideTop: { display: 'flex', position: 'relative' },
  brandBox: { display: 'flex', alignItems: 'center', gap: 10 },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 8,
    objectFit: 'cover' as const,
    display: 'block',
  },
  brandName: { fontWeight: 700, fontSize: 16, color: 'var(--content-primary)' },
  sideBody: { margin: 'auto 0', paddingBottom: 40, position: 'relative' },
  sideTitle: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: 30,
    lineHeight: 1.05,
    letterSpacing: 0,
    color: 'var(--content-primary)',
  },
  sideText: { margin: '16px 0 0', color: 'var(--content-secondary)', fontSize: 15, lineHeight: 1.6, maxWidth: 330 },
  sidePoints: { marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 },
  sidePoint: { display: 'flex', alignItems: 'center', gap: 10, color: 'var(--content-primary)', fontSize: 14, fontWeight: 500 },
  sideDot: { width: 6, height: 6, borderRadius: '50%', background: '#65CF21', flexShrink: 0 },
  sideFoot: { color: 'var(--content-secondary)', fontSize: 13, fontWeight: 600, position: 'relative' },

  main: { flex: 1, display: 'grid', placeItems: 'center', padding: 24 },
  title: { margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1 },
  subtitle: { margin: '-8px 0 6px', color: 'var(--content-secondary)', fontSize: 15 },

  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: 'var(--content-primary)' },
  input: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-neutral)',
    borderRadius: 10,
    padding: '11px 13px',
    color: 'var(--content-primary)',
    fontSize: 15,
  },
  error: {
    color: 'var(--negative)',
    background: 'var(--negative-bg)',
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    margin: 0,
    fontSize: 14,
  },
  foot: { display: 'flex', justifyContent: 'center', marginTop: 2 },
  backLink: {
    color: 'var(--content-link)',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'underline',
    textUnderlineOffset: '0.3em',
  },
};
