'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { useLang } from '../i18n/LanguageProvider';
import { useIsMobile } from '../hooks/useIsMobile';
import { shared as s } from './theme';
import { IconGlobe } from './icons';

export function Header() {
  const { t, lang, setLang } = useLang();
  const pathname  = usePathname();
  const isMobile  = useIsMobile();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/',          label: t.nav.home    },
    { href: '/a-propos',  label: t.nav.about   },
    { href: '/support',   label: t.nav.support },
  ];

  if (isMobile) {
    return (
      <>
        <header style={m.header}>
          <Link href="/" style={s.brand} onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/air.png" alt="Air Congo" height={30} style={{ objectFit: 'contain', flexShrink: 0 }} />
            <span style={s.brandText}>{t.brand}</span>
          </Link>
          <div style={m.headerRight}>
            <span style={s.langWrap}>
              <span style={s.globe}><IconGlobe size={14} /></span>
              <button type="button" onClick={() => setLang('fr')} style={{ ...s.langBtn, ...(lang === 'fr' ? s.langActive : {}) }}>FR</button>
              <span style={s.langSep}>|</span>
              <button type="button" onClick={() => setLang('en')} style={{ ...s.langBtn, ...(lang === 'en' ? s.langActive : {}) }}>EN</button>
            </span>
            <button style={m.burger} onClick={() => setOpen(v => !v)} aria-label="Menu">
              <BurgerIcon open={open} />
            </button>
          </div>
        </header>

        {open ? (
          <nav style={m.drawer}>
            {links.map((l) => {
              const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} style={active ? m.drawerActive : m.drawerLink} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </>
    );
  }

  return (
    <header style={{ ...s.header, position: 'sticky', top: 0, zIndex: 20 }}>
      <Link href="/" style={s.brand}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/air.png" alt="Air Congo" height={32} style={{ objectFit: 'contain', flexShrink: 0 }} />
        <span style={s.brandText}>{t.brand}</span>
      </Link>
      <nav style={s.nav}>
        {links.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} style={active ? s.navActive : s.navLink}>
              {l.label}
            </Link>
          );
        })}
        <span style={s.langWrap}>
          <span style={s.globe}><IconGlobe size={15} /></span>
          <button type="button" onClick={() => setLang('fr')} style={{ ...s.langBtn, ...(lang === 'fr' ? s.langActive : {}) }}>FR</button>
          <span style={s.langSep}>|</span>
          <button type="button" onClick={() => setLang('en')} style={{ ...s.langBtn, ...(lang === 'en' ? s.langActive : {}) }}>EN</button>
        </span>
      </nav>
    </header>
  );
}

function BurgerIcon({ open }: { open: boolean }) {
  const bar: CSSProperties = { width: 22, height: 2.5, borderRadius: 2, background: '#f1f5f9', transition: 'all 0.2s' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ ...bar, transform: open ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
      <span style={{ ...bar, opacity: open ? 0 : 1 }} />
      <span style={{ ...bar, transform: open ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
    </div>
  );
}

const glass: CSSProperties = {
  background: 'var(--glass-strong)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: '1px solid var(--glass-border)',
};

const m: Record<string, CSSProperties> = {
  header: { ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderLeft: 'none', borderRight: 'none', borderTop: 'none', position: 'sticky', top: 0, zIndex: 20 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  burger: { background: 'transparent', border: 'none', color: '#f1f5f9', padding: 4, display: 'grid', placeItems: 'center' },
  drawer: { ...glass, display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 16px', borderLeft: 'none', borderRight: 'none', position: 'sticky', top: 56, zIndex: 19 },
  drawerLink: { padding: '12px 8px', fontSize: 15, fontWeight: 600, color: 'var(--muted)', borderRadius: 8 },
  drawerActive: { padding: '12px 8px', fontSize: 15, fontWeight: 700, color: 'var(--text)', borderRadius: 8 },
};
