import type { CSSProperties } from 'react';

// Primitives de style du portail, registre Uber (voir apps/web/DESIGN.md).
// Noir et blanc pour la structure, un seul accent bleu qui signale. Rayon 8
// ou pilule. Une carte est portée par une ombre douce et un filet clair.

// Carte blanche : l'ancien nom est conservé, les pages composent dessus.
export const glass: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--divider)',
  boxShadow: 'var(--shadow-card)',
};

// Encart teinté : aplat gris, aucune bordure, aucune ombre.
export const tile: CSSProperties = {
  background: 'var(--bg-neutral)',
  border: 'none',
};

// Styles partagés par toutes les pages (shell, header, breadcrumb, contenu légal).
export const shared: Record<string, CSSProperties> = {
  shell: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-screen)' },

  // Barre du haut : collante, blanche, 64 px, liens en pilules neutres.
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
    borderBottom: '1px solid var(--divider)',
    color: 'var(--content-primary)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandIcon: { color: 'var(--content-primary)', fontSize: 22 },
  brandText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    fontSize: 17,
    color: 'var(--content-primary)',
  },
  nav: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 15 },
  navActive: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-neutral-hover)',
    fontWeight: 600,
    color: 'var(--content-primary)',
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
  globe: { display: 'inline-flex', alignItems: 'center', color: 'var(--content-primary)' },
  langBtn: { background: 'none', border: 'none', padding: 0, color: 'var(--content-secondary)', fontWeight: 500 },
  langActive: { color: 'var(--content-primary)', fontWeight: 700 },
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

  // Pages de contenu (À propos, légal) : titre Figtree 700, resserré.
  contentTitle: {
    margin: '20px 0 8px',
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.75rem, 6vw, 2.25rem)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
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
    borderRadius: 8,
    padding: '28px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionHeading: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 'var(--lh-title)',
    color: 'var(--content-primary)',
  },
  paragraph: { margin: 0, color: 'var(--content-secondary)', fontSize: 15.5, lineHeight: 1.6 },
};
