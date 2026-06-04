import type { CSSProperties } from 'react';

export const glass: CSSProperties = {
  background: 'var(--glass-strong)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: '1px solid var(--glass-border)',
};

// Styles partagés par toutes les pages (shell, header, breadcrumb, footer, contenu légal).
export const shared: Record<string, CSSProperties> = {
  shell: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },

  header: {
    ...glass,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandIcon: { color: 'var(--primary)', fontSize: 22 },
  brandText: { fontWeight: 800, letterSpacing: 1, fontSize: 18, color: 'var(--text)' },
  nav: { display: 'flex', alignItems: 'center', gap: 26, fontSize: 15 },
  navActive: { fontWeight: 700, color: 'var(--text)' },
  navLink: { color: 'var(--muted)' },
  langWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 20,
    borderLeft: '1px solid var(--glass-border)',
  },
  globe: { opacity: 0.8, display: 'inline-flex', alignItems: 'center' },
  langBtn: { background: 'none', border: 'none', padding: 0, color: 'var(--muted)', fontWeight: 600 },
  langActive: { color: 'var(--primary)', fontWeight: 800 },
  langSep: { color: 'var(--muted)' },

  breadcrumb: { display: 'flex', gap: 8, alignItems: 'center', padding: '14px 32px', fontSize: 14 },
  crumbMuted: { color: 'var(--muted)' },
  crumbSep: { color: 'var(--muted)' },
  crumbLink: { color: 'var(--muted)' },

  main: {
    flex: 1,
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    padding: '24px 24px 80px',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  mainMobile: { padding: '16px 14px 48px', gap: 16 },

  // Pages de contenu (À propos, légal)
  contentTitle: {
    margin: '20px 0 8px',
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: 0.5,
    textShadow: '0 4px 24px rgba(0,0,0,0.5)',
  },
  contentIntro: { margin: '0 0 8px', color: 'var(--muted)', fontSize: 17, lineHeight: 1.6, maxWidth: 760 },
  updated: { margin: 0, color: 'var(--muted)', fontSize: 13 },
  contentCard: {
    ...glass,
    borderRadius: 14,
    padding: '24px 26px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionHeading: { margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' },
  paragraph: { margin: 0, color: 'var(--muted)', fontSize: 15, lineHeight: 1.65 },

  // Footer
  footer: {
    ...glass,
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    padding: '40px 32px 28px',
  },
  footerInner: {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 32,
  },
  footerBrandText: { fontWeight: 800, letterSpacing: 1, fontSize: 17, color: 'var(--text)' },
  footerTagline: { margin: '10px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.5, maxWidth: 320 },
  footerColTitle: {
    margin: '0 0 12px',
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'var(--text)',
  },
  footerList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 },
  footerLink: { color: 'var(--muted)', fontSize: 14 },
  footerBottom: {
    width: '100%',
    maxWidth: 1180,
    margin: '28px auto 0',
    paddingTop: 18,
    borderTop: '1px solid var(--glass-border)',
    color: 'var(--muted)',
    fontSize: 13,
  },
};
