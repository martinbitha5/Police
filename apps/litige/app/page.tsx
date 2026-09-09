import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { SITE_APPS } from '@/lib/site-apps';
import { eyebrow } from '@/ui/theme';
import { IconHome as NavHome, IconSearch as NavSearch, IconPlane as NavPlane, IconLogin as NavLogin } from '@/components/icons';

const HUB = process.env.NEXT_PUBLIC_HUB ?? 'FIH';

export const metadata = {
  title: 'Litige Bagage · Supervision',
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
    desc: 'Qualifiez chaque dossier : motif, notes internes et historique horodaté. Ouvert, en cours ou résolu, tout est tracé.',
  },
  {
    icon: <IconChart />,
    title: 'Exportez le rapport du jour',
    desc: 'Téléchargez le bilan Excel des litiges de la journée en un clic : étiquette, passager, statut et résolution.',
  },
];

const STEPS = [
  { n: 'Étape 1', title: 'Signalement', desc: 'Un bagage est marqué en litige sur le terrain, ou un passager dépose une réclamation.' },
  { n: 'Étape 2', title: 'Qualification', desc: 'Ouvrez le dossier : motif, chargement en soute, bagages déclarés.' },
  { n: 'Étape 3', title: 'Enquête', desc: 'Consignez vos notes internes et suivez l’état du bagage au fil du temps.' },
  { n: 'Étape 4', title: 'Résolution', desc: 'Clôturez le litige, horodaté et inclus dans le rapport du jour.' },
];

export default function Landing() {
  return (
    <div style={s.page}>
      {/* Barre de navigation : bascule en rangée d'icônes au défilement sur
          téléphone (classes .pb-* de globals.css). */}
      <header className="lp-topbar">
        <div className="lp-topbar-inner pb-full">
          <Link href="/" style={s.brandBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Litige Bagage" style={s.brandLogo} />
            <span style={s.brandName}>Litige Bagage</span>
          </Link>
          <nav style={s.topNav}>
            <span className="hub-chip" style={s.hubChip}>Hub {HUB}</span>
            <Link href="/login" className="lp-login-btn">Connexion</Link>
          </nav>
        </div>

        {/* Rangée de raccourcis, téléphone et défilement seulement */}
        <nav className="lp-topbar-icons pb-icons" aria-label="Raccourcis">
          <Link href="/" className="pb-icon pb-icon-on" aria-label="Accueil">
            <NavHome size={21} />
          </Link>
          {SITE_APPS.filter((a) => a.label !== 'Espace superviseur').map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pb-icon"
              aria-label={a.label}
            >
              {a.label === 'Suivi bagage' ? <NavSearch size={20} /> : <NavPlane size={20} />}
            </a>
          ))}
          <Link href="/login" className="pb-icon pb-icon-cta" aria-label="Connexion">
            <span className="pb-icon-pill">
              <NavLogin size={19} />
            </span>
          </Link>
        </nav>
      </header>

      {/* Héro : 2 colonnes, titre display, visuel arrondi */}
      <section className="lp-hero">
        <div className="lp-hero-grid">
          <div className="lp-hero-copy rv">
            <h1 className="lp-title">Chaque bagage suivi. Chaque litige résolu.</h1>
            <p className="lp-tagline">
              Le portail pour déclarer, suivre et résoudre vos litiges et réclamations
              bagage. Du signalement à la clôture, chaque dossier est tracé.
            </p>
            <div className="lp-actions">
              <Link href="/login" className="lp-cta">Ouvrir un dossier</Link>
              <a href="#fonctionnement" className="lp-cta-link">Voir le déroulé</a>
            </div>

            <div className="lp-stats" data-rv-auto>
              <div className="lp-stat">
                <div className="lp-stat-value">Par jour</div>
                <div className="lp-stat-label">Litiges filtrés par date, vol et statut de chargement</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-value">Horodaté</div>
                <div className="lp-stat-label">Motif, notes et résolution conservés pour chaque bagage</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-value">Excel</div>
                <div className="lp-stat-label">Le rapport des litiges de la journée en un clic</div>
              </div>
            </div>
          </div>

          <div className="lp-hero-media rv" style={{ transitionDelay: '120ms' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/IMG_9478.jpeg" alt="Avion au contact et chargement des bagages sur le tarmac" />
          </div>
        </div>
      </section>

      {/* Capacités : cartes blanches, icônes en disque gris */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <h2 className="lp-section-title rv">Faites tout, au même endroit</h2>
          <div className="lp-cap-grid" data-rv-auto>
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

      {/* Déroulé opérationnel : section teintée */}
      <section id="fonctionnement" className="lp-section lp-section-tinted">
        <div className="lp-section-inner">
          <h2 className="lp-section-title rv">Un litige, quatre étapes</h2>
          <div className="lp-steps" data-rv-auto>
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

      {/* Bandeau d'encre : appel à l'action inversé */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-band rv">
            <h2 className="lp-band-title">Aucun bagage ne reste sans suite.</h2>
            <p className="lp-band-text">
              Du signalement à la résolution, chaque litige est tracé, documenté et clôturé,
              pour le passager comme pour l’exploitation.
            </p>
            <Link href="/login" className="lp-band-btn">Ouvrir un dossier</Link>
          </div>
        </div>
      </section>

      {/* Bande partenaires */}
      <section className="rv" style={s.partnerBand}>
        <span style={s.partnerLabel}>Partenaire opérationnel</span>
        <div style={s.partnerDivider} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/air.png" alt="Air Congo" style={s.partnerLogo} />
      </section>

      {/* Pied de page : bloc commun à toute l'application */}
      <Footer />
    </div>
  );
}

// Icônes : trait 1.8, couleur héritée du disque qui les porte.

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

  brandBox: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  brandLogo: { width: 32, height: 32, borderRadius: 8, objectFit: 'cover' as const, display: 'block', flexShrink: 0 },
  brandName: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: '-0.02em',
    color: 'var(--content-primary)',
    whiteSpace: 'nowrap',
  },
  topNav: { display: 'flex', alignItems: 'center', gap: 12 },
  // `display` volontairement absent : il est porté par la classe .hub-chip, afin
  // que la media query mobile puisse masquer la pastille.
  hubChip: {
    alignItems: 'center',
    background: 'var(--bg-neutral)',
    borderRadius: 9999,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--content-primary)',
  },

  /* Bande partenaires : un filet, un libellé en capitales, le logo sur fond
     blanc (il est dessiné pour le blanc). */
  partnerBand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap' as const,
    padding: '28px 24px',
    background: 'var(--bg-screen)',
    borderTop: '1px solid var(--border-neutral)',
  },
  partnerLabel: { ...eyebrow, margin: 0 },
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
};
