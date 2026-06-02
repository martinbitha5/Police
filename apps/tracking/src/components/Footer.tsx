'use client';

import Link from 'next/link';
import { useLang } from '../i18n/LanguageProvider';
import { shared as s } from './theme';

export function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/a-propos', label: t.nav.about },
    { href: '/support', label: t.nav.support },
  ];
  const legalLinks = [
    { href: '/mentions-legales', label: t.breadcrumb.mentions },
    { href: '/confidentialite', label: t.breadcrumb.privacy },
    { href: '/conditions', label: t.breadcrumb.terms },
    { href: '/cookies', label: t.breadcrumb.cookies },
  ];

  return (
    <footer style={s.footer}>
      <div style={s.footerInner}>
        <div>
          <div style={s.brand}>
            <span style={s.footerBrandText}>{t.brand}</span>
          </div>
          <p style={s.footerTagline}>{t.footer.tagline}</p>
        </div>

        <div>
          <h3 style={s.footerColTitle}>{t.footer.navTitle}</h3>
          <ul style={s.footerList}>
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} style={s.footerLink}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={s.footerColTitle}>{t.footer.legalTitle}</h3>
          <ul style={s.footerList}>
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} style={s.footerLink}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={s.footerColTitle}>{t.footer.contactTitle}</h3>
          <ul style={s.footerList}>
            <li style={s.footerLink}>{t.support.email}</li>
            <li style={s.footerLink}>{t.support.phone}</li>
          </ul>
        </div>
      </div>

      <div style={s.footerBottom}>
        © {year} {t.brand}. {t.footer.rights}
      </div>
    </footer>
  );
}
