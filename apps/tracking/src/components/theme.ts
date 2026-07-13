import type { CSSProperties } from 'react';

// Panneau en verre dépoli translucide — spatial UI (teinté navy + flou du fond).
export const glass: CSSProperties = {
  background: 'var(--glass)',
  border: '1px solid var(--glass-border)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
};

// Styles partagés par toutes les pages (shell, header, breadcrumb, footer, contenu légal).
export const shared: Record<string, CSSProperties> = {
  shell: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    background: 'rgba(9, 14, 26, 0.6)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    borderBottom: '1px solid var(--glass-border)',
    color: 'var(--side-text)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandIcon: { color: '#7da2f5', fontSize: 22 },
  brandText: { fontWeight: 800, letterSpacing: 0.8, fontSize: 18, color: '#ffffff' },
  nav: { display: 'flex', alignItems: 'center', gap: 26, fontSize: 15 },
  navActive: { fontWeight: 700, color: '#ffffff' },
  navLink: { color: 'var(--side-muted)' },
  langWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 20,
    borderLeft: '1px solid rgba(255,255,255,0.15)',
  },
  globe: { opacity: 0.8, display: 'inline-flex', alignItems: 'center' },
  langBtn: { background: 'none', border: 'none', padding: 0, color: 'var(--side-muted)', fontWeight: 600 },
  langActive: { color: '#7da2f5', fontWeight: 800 },
  langSep: { color: 'var(--side-muted)' },

  breadcrumb: { display: 'flex', gap: 8, alignItems: 'center', padding: '14px 32px', fontSize: 14 },
  crumbMuted: { color: 'var(--muted)' },
  crumbSep: { color: 'var(--faint)' },
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
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: -0.7,
    color: 'var(--text)',
  },
  contentIntro: { margin: '0 0 8px', color: 'var(--muted)', fontSize: 16.5, lineHeight: 1.65, maxWidth: 760 },
  updated: { margin: 0, color: 'var(--faint)', fontSize: 13 },
  contentCard: {
    ...glass,
    borderRadius: 12,
    padding: '28px 30px',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionHeading: { margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--text)' },
  paragraph: { margin: 0, color: 'var(--muted)', fontSize: 15, lineHeight: 1.65 },

  // Footer — verre translucide, cohérent avec le header
  footer: {
    background: 'rgba(9, 14, 26, 0.6)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    borderTop: '1px solid var(--glass-border)',
    padding: '44px 32px 28px',
    color: 'var(--side-muted)',
  },
  footerInner: {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 32,
  },
  footerBrandText: { fontWeight: 800, letterSpacing: 0.8, fontSize: 17, color: '#ffffff' },
  footerTagline: { margin: '10px 0 0', color: 'var(--side-muted)', fontSize: 14, lineHeight: 1.55, maxWidth: 320 },
  footerColTitle: {
    margin: '0 0 12px',
    fontSize: 12.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#c4d2ea',
  },
  footerList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 },
  footerLink: { color: 'var(--side-muted)', fontSize: 14 },
  footerBottom: {
    width: '100%',
    maxWidth: 1180,
    margin: '28px auto 0',
    paddingTop: 18,
    borderTop: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--side-muted)',
    fontSize: 13,
  },
};
