import type { CSSProperties } from 'react';

// Carte blanche Wise — remplace l'ancien panneau en verre dépoli.
// Plus de blur, plus d'ombre par défaut : fond blanc + bordure fine.
export const glass: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-neutral)',
};

// Tuile teintée Wise — cartes marketing : fond vert forêt à 8 %,
// aucune bordure, aucune ombre, radius large.
export const tile: CSSProperties = {
  background: 'var(--bg-neutral)',
  border: 'none',
};

// Styles partagés par toutes les pages (shell, header, breadcrumb, footer, contenu légal).
export const shared: Record<string, CSSProperties> = {
  shell: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-screen)' },

  // Navbar Wise : sticky, blanche, 76px, liens en pilules neutres.
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1050,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 'var(--nav-height)',
    padding: '0 32px',
    background: 'var(--bg-screen)',
    borderBottom: '1px solid var(--border-neutral)',
    color: 'var(--content-primary)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandIcon: { color: 'var(--interactive-primary)', fontSize: 22 },
  brandText: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: 18, color: 'var(--content-primary)' },
  nav: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 15 },
  navActive: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-neutral)',
    fontWeight: 600,
    color: 'var(--interactive-primary)',
  },
  navLink: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 'var(--radius-full)',
    color: 'var(--content-primary)',
    fontWeight: 500,
  },
  // Sélecteur de langue en pilule neutre
  langWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
    padding: '7px 14px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-neutral)',
  },
  globe: { display: 'inline-flex', alignItems: 'center', color: 'var(--interactive-primary)' },
  langBtn: { background: 'none', border: 'none', padding: 0, color: 'var(--content-secondary)', fontWeight: 600 },
  langActive: { color: 'var(--interactive-primary)', fontWeight: 700 },
  langSep: { color: 'var(--content-tertiary)' },

  breadcrumb: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '14px 32px',
    fontSize: 14,
    color: 'var(--content-secondary)',
  },
  crumbMuted: { color: 'var(--content-secondary)' },
  crumbSep: { color: 'var(--content-tertiary)' },
  crumbLink: { color: 'var(--content-link)', textDecoration: 'underline', textUnderlineOffset: '0.3em' },

  main: {
    flex: 1,
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    padding: '24px 24px 96px',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  mainMobile: { padding: '16px 14px 56px', gap: 16 },
  // Pages de texte long (À propos, légal) : conteneur 700px
  mainText: { maxWidth: 'var(--container-text)', margin: '0 auto' } as CSSProperties,

  // Pages de contenu (À propos, légal)
  contentTitle: {
    margin: '20px 0 8px',
    fontSize: 'clamp(1.75rem, 6vw, 2.25rem)',
    fontWeight: 600,
    letterSpacing: 'var(--ls-heading)',
    lineHeight: 'var(--lh-title)',
    color: 'var(--content-primary)',
    overflowWrap: 'break-word',
  },
  contentIntro: {
    margin: '0 0 8px',
    color: 'var(--content-secondary)',
    fontSize: 17,
    lineHeight: 1.55,
    maxWidth: 'var(--container-text)',
  },
  updated: { margin: 0, color: 'var(--content-tertiary)', fontSize: 13 },
  contentCard: {
    ...glass,
    borderRadius: 'var(--radius-md)',
    padding: '28px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionHeading: {
    margin: 0,
    fontSize: 19,
    fontWeight: 600,
    letterSpacing: 'var(--ls-heading)',
    lineHeight: 'var(--lh-title)',
    color: 'var(--content-primary)',
  },
  paragraph: { margin: 0, color: 'var(--content-secondary)', fontSize: 15.5, lineHeight: 1.6 },

  // Footer Wise — clair, fond teinté, aucune ombre
  footer: {
    background: 'var(--bg-neutral)',
    padding: '80px 32px 40px',
    color: 'var(--content-secondary)',
    fontSize: 14,
  },
  footerInner: {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 32,
  },
  footerBrandText: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: 17, color: 'var(--content-primary)' },
  footerTagline: { margin: '10px 0 0', color: 'var(--content-secondary)', fontSize: 14, lineHeight: 1.55, maxWidth: 320 },
  footerColTitle: {
    margin: '0 0 12px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--content-primary)',
  },
  footerList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 },
  footerLink: { color: 'var(--content-secondary)', fontSize: 14 },
  footerBottom: {
    width: '100%',
    maxWidth: 1180,
    margin: '28px auto 0',
    paddingTop: 18,
    borderTop: '1px solid var(--border-neutral)',
    color: 'var(--content-secondary)',
    fontSize: 13,
  },
};
