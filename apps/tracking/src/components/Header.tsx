'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '../i18n/LanguageProvider';
import { shared as s } from './theme';
import { IconGlobe } from './icons';

export function Header() {
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/a-propos', label: t.nav.about },
    { href: '/support', label: t.nav.support },
  ];

  return (
    <header style={s.header}>
      <Link href="/" style={s.brand}>
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
          <button
            type="button"
            onClick={() => setLang('fr')}
            style={{ ...s.langBtn, ...(lang === 'fr' ? s.langActive : {}) }}
          >
            FR
          </button>
          <span style={s.langSep}>|</span>
          <button
            type="button"
            onClick={() => setLang('en')}
            style={{ ...s.langBtn, ...(lang === 'en' ? s.langActive : {}) }}
          >
            EN
          </button>
        </span>
      </nav>
    </header>
  );
}
