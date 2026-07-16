import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

const HUB = process.env.NEXT_PUBLIC_HUB ?? 'FIH';

export const metadata = {
  title: 'Litige Bagage — Supervision',
  description: 'Déclarez, suivez et résolvez vos litiges bagage.',
};

const CAPABILITIES: { icon: ReactNode; title: string; desc: string }[] = [
  {
    icon: <IconBag />,
    title: 'Suivez les litiges',
    desc: 'Retrouvez tous les bagages d’un vol dans une seule file. Filtrez par jour, statut de chargement et état du litige.',
  },
  {
    icon: <IconUser />,
    title: 'Traitez les réclamations',
    desc: 'Les signalements des passagers arrivent directement dans votre liste, prêts à être traités. Sans file d’attente.',
  },
  {
    icon: <IconSearch />,
    title: 'Enquêtez et résolvez',
    desc: 'Qualifiez chaque dossier : motif, notes internes et historique horodaté. Ouvert, en cours ou résolu — tout est tracé.',
  },
  {
    icon: <IconChart />,
    title: 'Exportez le rapport du jour',
    desc: 'Téléchargez le bilan Excel des litiges de la journée en un clic : étiquette, passager, statut et résolution.',
  },
];

const STEPS = [
  { n: 'ÉTAPE 1', title: 'Signalement', desc: 'Un bagage est marqué en litige sur le terrain, ou un passager dépose une réclamation.' },
  { n: 'ÉTAPE 2', title: 'Qualification', desc: 'Ouvrez le dossier : motif, chargement en soute, bagages déclarés.' },
  { n: 'ÉTAPE 3', title: 'Enquête', desc: 'Consignez vos notes internes et suivez l’état du bagage au fil du temps.' },
  { n: 'ÉTAPE 4', title: 'Résolution', desc: 'Clôturez le litige, horodaté et inclus dans le rapport du jour.' },
];

export default function Landing() {
  return (
    <div style={s.page}>
      {/* Barre de navigation */}
      <header className="lp-topbar">
        <div className="lp-topbar-inner">
          <div style={s.brandBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Litige Bagage" style={s.brandLogo} />
            <span style={s.brandName}>Litige Bagage</span>
          </div>
          <nav style={s.topNav}>
            <span className="lp-nav-pill">Hub {HUB}</span>
            <Link href="/login" className="lp-login-btn">Connexion</Link>
          </nav>
        </div>
      </header>

      {/* Héros — 2 colonnes */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div>
            <div className="lp-kicker">Espace superviseur — litiges bagage</div>
            <h1 className="lp-title">Chaque bagage suivi. Chaque litige résolu.</h1>
            <p className="lp-tagline">
              Le portail pour déclarer, suivre et résoudre vos litiges et réclamations bagage
              comme un pro. Sans paperasse inutile.
            </p>
            <div className="lp-actions">
              <Link href="/login" className="lp-cta">Ouvrir un dossier</Link>
              <a href="#fonctionnement" className="lp-cta-ghost">Voir comment ça marche</a>
            </div>
          </div>
          <HeroArt />
        </div>

        {/* Tuiles de faits */}
        <div className="lp-facts">
          <div className="lp-fact">
            <div className="lp-fact-value">Par jour</div>
            <div className="lp-fact-label">Filtrez vos litiges par date, vol et statut de chargement.</div>
          </div>
          <div className="lp-fact">
            <div className="lp-fact-value">Passager</div>
            <div className="lp-fact-label">Recevez les réclamations directement dans votre file.</div>
          </div>
          <div className="lp-fact">
            <div className="lp-fact-value">Horodaté</div>
            <div className="lp-fact-label">Conservez motif, notes et résolution pour chaque bagage.</div>
          </div>
          <div className="lp-fact">
            <div className="lp-fact-value">Excel</div>
            <div className="lp-fact-label">Exportez le rapport des litiges de la journée en un clic.</div>
          </div>
        </div>
      </section>

      {/* Bandeau vert vif */}
      <section className="lp-band">
        <div className="lp-band-inner">
          <h2 className="lp-band-title">Aucun bagage ne reste sans suite.</h2>
          <p className="lp-band-text">
            Du signalement à la résolution, chaque litige est tracé, documenté et clôturé —
            pour le passager comme pour l’exploitation.
          </p>
          <Link href="/login" className="lp-band-btn">Ouvrir un dossier</Link>
        </div>
      </section>

      {/* Capacités */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-kicker">Capacités</div>
          <h2 className="lp-section-title">Faites tout, au même endroit.</h2>
          <div className="lp-cap-grid">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="lp-cap">
                <div className="lp-cap-icon">{c.icon}</div>
                <div className="lp-cap-title">{c.title}</div>
                <div className="lp-cap-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Déroulé opérationnel */}
      <section id="fonctionnement" className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-section-inner">
          <div className="lp-section-kicker">Fonctionnement</div>
          <h2 className="lp-section-title">Résolvez en quatre étapes.</h2>
          <div className="lp-steps">
            {STEPS.map((st) => (
              <div key={st.n} className="lp-step">
                <div className="lp-step-num">{st.n}</div>
                <div className="lp-step-title">{st.title}</div>
                <div className="lp-step-desc">{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bande partenaires */}
      <section style={s.partnerBand}>
        <span style={s.partnerLabel}>Partenaire opérationnel</span>
        <div style={s.partnerDivider} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/air.png" alt="Air Congo" style={s.partnerLogo} />
      </section>

      {/* Pied de page */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Litige Bagage" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover', display: 'block' }} />
            <span style={{ color: 'var(--content-primary)', fontWeight: 600 }}>Litige Bagage</span>
            <span style={{ color: 'var(--content-tertiary)', fontSize: 16 }}>·</span>
            <span style={s.footerAirPill}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/air.png" alt="Air Congo" style={{ height: 20, objectFit: 'contain', display: 'block' }} />
            </span>
          </div>
          <span>Accès réservé au personnel autorisé</span>
        </div>
      </footer>
    </div>
  );
}

/** Routes aériennes stylisées — palette Wise (verts et neutres). */
function HeroArt() {
  return (
    <svg className="lp-hero-art" viewBox="0 0 560 460" aria-hidden>
      {/* Fond arrondi teinté */}
      <rect width="560" height="460" rx="32" fill="rgba(22,51,0,0.08)" />

      <g stroke="rgba(14,15,12,0.10)" strokeWidth="1">
        <line x1="0" y1="115" x2="560" y2="115" />
        <line x1="0" y1="230" x2="560" y2="230" />
        <line x1="0" y1="345" x2="560" y2="345" />
        <line x1="140" y1="0" x2="140" y2="460" />
        <line x1="280" y1="0" x2="280" y2="460" />
        <line x1="420" y1="0" x2="420" y2="460" />
      </g>

      <g fill="none" stroke="#163300" strokeWidth="2" opacity="0.55">
        <path d="M 40 350 Q 200 90 400 160" />
        <path d="M 90 400 Q 300 200 520 250" />
        <path d="M 15 225 Q 180 45 355 100" />
      </g>
      <g fill="none" stroke="#163300" strokeWidth="1.4" strokeDasharray="2 7" opacity="0.35">
        <path d="M 65 390 Q 250 150 470 210" />
        <path d="M 30 285 Q 215 105 430 130" />
      </g>

      <g fill="#65CF21">
        <circle cx="40" cy="350" r="4" />
        <circle cx="400" cy="160" r="4" />
        <circle cx="15" cy="225" r="3.5" />
        <circle cx="355" cy="100" r="3.5" />
        <circle cx="520" cy="250" r="4" />
        <circle cx="90" cy="400" r="3.5" />
      </g>
      <g fill="none" stroke="#65CF21" strokeWidth="1.4" opacity="0.7">
        <circle cx="400" cy="160" r="10" />
        <circle cx="40" cy="350" r="10" />
        <circle cx="520" cy="250" r="10" />
      </g>

      {/* Étiquette bagage stylisée */}
      <g transform="translate(360, 290)">
        <rect x="0" y="0" width="150" height="94" rx="16" fill="#9FE870" />
        <circle cx="26" cy="26" r="9" fill="none" stroke="#163300" strokeWidth="2.5" />
        <line x1="42" y1="24" x2="124" y2="24" stroke="#163300" strokeWidth="4" strokeLinecap="round" />
        <line x1="18" y1="52" x2="132" y2="52" stroke="#163300" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
        <line x1="18" y1="70" x2="96" y2="70" stroke="#163300" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      </g>
    </svg>
  );
}

// ── Icônes ───────────────────────────────────────────────────

function IconBag() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="7" width="14" height="14" rx="2" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M7 13l3-3 4 4 5-6" />
    </svg>
  );
}

const s: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-screen)' },

  brandBox: { display: 'flex', alignItems: 'center', gap: 10 },
  brandLogo: { width: 32, height: 32, borderRadius: 8, objectFit: 'cover' as const, display: 'block', flexShrink: 0 },
  brandName: { fontWeight: 700, fontSize: 17, letterSpacing: -0.2, color: 'var(--content-primary)' },
  topNav: { display: 'flex', alignItems: 'center', gap: 8 },

  /* Bande partenaires */
  partnerBand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '28px 24px',
    background: 'var(--bg-screen)',
    borderTop: '1px solid var(--border-neutral)',
  },
  partnerLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--content-secondary)',
  },
  partnerDivider: {
    width: 1,
    height: 28,
    background: 'var(--border-neutral)',
  },
  partnerLogo: {
    height: 38,
    objectFit: 'contain' as const,
    display: 'block',
  },
  footerAirPill: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#fff',
    borderRadius: 9999,
    padding: '5px 12px',
  },
};
