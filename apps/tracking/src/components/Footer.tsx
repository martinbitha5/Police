'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
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
          <div style={{ ...s.brand, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/air.png" alt="Air Congo" height={38} style={{ objectFit: 'contain', display: 'block' }} />
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

        {/* Liens vers le portail officiel de l'aéroport FIH */}
        <div>
          <h3 style={s.footerColTitle}>Aéroport FIH</h3>
          <ul style={s.footerList}>
            {FIH_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} style={f.fihLink} target="_blank" rel="noopener noreferrer">
                  {l.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bannière site officiel */}
      <div style={s.footerBottom}>
        <a style={f.fihBanner} href="https://fih-rva.com" target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fih-logo.png" alt="RVA" width={22} height={22} style={{ objectFit: 'contain', background: '#fff', borderRadius: 6, padding: 2 }} />
          <span>Site officiel de l'Aéroport International de Kinshasa — <strong>fih-rva.com</strong></span>
          <span style={{ opacity: 0.7 }}>↗</span>
        </a>
        <span style={{ marginTop: 10, display: 'block' }}>© {year} {t.brand}. {t.footer.rights}</span>
      </div>
    </footer>
  );
}

const FIH_LINKS = [
  { href: 'https://fih-rva.com',                     label: 'Site officiel FIH' },
  { href: 'https://fih-rva.com/vols/departs',        label: 'Départs & arrivées' },
  { href: 'https://fih-rva.com/guide',               label: 'Guide du voyageur' },
  { href: 'https://fih-rva.com/guide/securite-bagages', label: 'Sécurité bagages' },
  { href: 'https://fih-rva.com/stationnement-transport', label: 'Stationnement' },
  { href: 'https://fih-rva.com/contact',             label: "Contacter l'aéroport" },
];

const f: Record<string, CSSProperties> = {
  fihLink: { color: 'var(--muted)', fontSize: 14, fontWeight: 500 },
  fihBanner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--muted)',
    fontSize: 13,
    fontWeight: 500,
  },
};
