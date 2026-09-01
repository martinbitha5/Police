'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { useLang } from '../i18n/LanguageProvider';
import { useIsMobile } from '../hooks/useIsMobile';
import { shared as s } from './theme';
import { IconGlobe, IconMenu, IconSearch, IconMail, IconBag, IconPlane, IconLogin } from './icons';
import { SITE_APPS } from '@/lib/site-apps';

// Raccourcis de la barre compacte vers les portails voisins. L'espace
// superviseur occupe la dernière cellule, en pastille pleine.
const APP_ICON: Record<string, (p: { size?: number }) => React.ReactElement> = {
  'Vols du jour': IconPlane,
  'Litiges bagage': IconBag,
  'Espace superviseur': IconLogin,
};

const QUICK_APPS = SITE_APPS.map((a) => ({
  label: a.label,
  url: a.url,
  icon: APP_ICON[a.label] ?? IconBag,
  cta: a.label === 'Espace superviseur',
}));

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
        <header className="pb-topbar" style={m.headerShell}>
          <div className="pb-bar pb-full" style={m.headerRow}>
          <Link href="/" style={{ ...s.brand, minWidth: 0, flexShrink: 1 }} onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/air.png" alt="Air Congo" height={30} style={{ objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ ...s.brandText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.brand}</span>
          </Link>
          <div style={{ ...m.headerRight, flexShrink: 0 }}>
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
          </div>

          <nav className="pb-icons" style={m.headerIcons} aria-label="Raccourcis">
            <button
              className={`pb-icon${open ? ' pb-icon-on' : ''}`}
              onClick={() => setOpen(v => !v)}
              aria-label="Menu"
            >
              <IconMenu size={22} />
            </button>
            <Link href="/" className={`pb-icon${pathname === '/' ? ' pb-icon-on' : ''}`} aria-label={t.nav.home} onClick={() => setOpen(false)}>
              <IconSearch size={20} />
            </Link>
            <Link href="/support" className={`pb-icon${pathname.startsWith('/support') ? ' pb-icon-on' : ''}`} aria-label={t.nav.support} onClick={() => setOpen(false)}>
              <IconMail size={20} />
            </Link>
            {QUICK_APPS.map((q) => {
              const Icon = q.icon;
              return (
                <a
                  key={q.url}
                  href={q.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`pb-icon${q.cta ? ' pb-icon-cta' : ''}`}
                  aria-label={q.label}
                >
                  {q.cta ? (
                    <span className="pb-icon-pill">
                      <Icon size={19} />
                    </span>
                  ) : (
                    <Icon size={20} />
                  )}
                </a>
              );
            })}
          </nav>
        </header>

        {open ? (
          <nav style={m.drawer}>
            {links.map((l) => {
              const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={active ? undefined : 'nav-pill'}
                  style={active ? m.drawerActive : m.drawerLink}
                  onClick={() => setOpen(false)}
                >
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
    <header style={s.header}>
      <Link href="/" style={s.brand}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/air.png" alt="Air Congo" height={32} style={{ objectFit: 'contain', flexShrink: 0 }} />
        <span style={s.brandText}>{t.brand}</span>
      </Link>
      <nav style={s.nav}>
        {links.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={active ? undefined : 'nav-pill'} style={active ? s.navActive : s.navLink}>
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
  const bar: CSSProperties = { width: 22, height: 2.5, borderRadius: 2, background: 'var(--content-primary)', transition: 'all 0.2s' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ ...bar, transform: open ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
      <span style={{ ...bar, opacity: open ? 0 : 1 }} />
      <span style={{ ...bar, transform: open ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
    </div>
  );
}

const m: Record<string, CSSProperties> = {
  headerShell: {
    background: 'var(--bg-screen)',
    borderBottom: '1px solid var(--border-neutral)',
    color: 'var(--content-primary)',
    position: 'sticky',
    top: 0,
    zIndex: 1050,
  },
  headerRow: {
    justifyContent: 'space-between',
    height: 64,
    padding: '0 16px',
  },
  // Pas de marge latérale : les cellules vont d'un bord à l'autre, séparées
  // par des filets, comme une rangée d'onglets.
  headerIcons: { height: 64 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  burger: { background: 'transparent', border: 'none', color: 'var(--content-primary)', padding: 4, display: 'grid', placeItems: 'center' },
  drawer: {
    background: 'var(--bg-screen)',
    borderBottom: '1px solid var(--border-neutral)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '12px 16px',
    position: 'sticky',
    top: 64,
    zIndex: 1049,
  },
  drawerLink: {
    padding: '12px 16px',
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--content-primary)',
    borderRadius: 'var(--radius-full)',
  },
  drawerActive: {
    padding: '12px 16px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--interactive-primary)',
    background: 'var(--bg-neutral)',
    borderRadius: 'var(--radius-full)',
  },
};
