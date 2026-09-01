'use client';

import Link from 'next/link';
import type { CSSProperties, ReactElement } from 'react';
import { useLang } from '../i18n/LanguageProvider';
import { shared as s } from './theme';
import { SITE_APPS } from '@/lib/site-apps';

// ── Marques des réseaux sociaux ──────────────────────────────────
// Glyphes pleins, à part du jeu d'icônes en trait de icons.tsx : ces marques
// ne se dessinent pas correctement en contour. Ils héritent de la couleur du
// texte (`currentColor`), donc du survol appliqué par .sf-social-item.
//
// Déclarés AVANT la table SOCIALS qui les référence : en développement, Fast
// Refresh réécrit les composants en affectations de variables, qui ne sont pas
// remontées comme les déclarations de fonction. Placés plus bas, ils étaient
// indéfinis au moment où SOCIALS est évalué.

function socialSvg(children: ReactElement) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function IconLinkedIn() {
  return socialSvg(
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.65h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.39 2.35 4.39 5.4V21h-4v-5.5c0-1.31-.02-3-1.9-3-1.9 0-2.2 1.42-2.2 2.9V21h-4V9z" />,
  );
}

function IconFacebook() {
  return socialSvg(
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />,
  );
}

function IconX() {
  return socialSvg(
    <path d="M18.24 2.25h3.31l-7.23 8.26L22.79 21.75h-6.63l-5.2-6.8-5.95 6.8H1.7l7.73-8.84L1.21 2.25h6.8l4.7 6.21 5.53-6.21zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z" />,
  );
}

function IconInstagram() {
  return socialSvg(
    <>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zm0 1.98c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.64 3.64 0 0 0-.88-1.35 3.64 3.64 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07z" />
      <path d="M12 15.33a3.33 3.33 0 1 1 0-6.66 3.33 3.33 0 0 1 0 6.66zm0-8.46a5.13 5.13 0 1 0 0 10.26 5.13 5.13 0 0 0 0-10.26z" />
      <circle cx="17.34" cy="6.66" r="1.2" />
    </>,
  );
}

// Réseaux sociaux. Les comptes ne sont pas encore ouverts : tant que `url` est
// vide, l'icône est affichée sans être cliquable. Renseigner l'adresse ici
// suffit à la transformer en lien, sans autre changement.
const SOCIALS: { name: string; url: string; Icon: () => ReactElement }[] = [
  { name: 'LinkedIn', url: '', Icon: IconLinkedIn },
  { name: 'Facebook', url: '', Icon: IconFacebook },
  { name: 'X', url: '', Icon: IconX },
  { name: 'Instagram', url: '', Icon: IconInstagram },
];

export function Footer() {
  const { t, lang } = useLang();
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
    <footer className="site-footer" style={s.footer}>
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
                <Link href={l.href} className="footer-link" style={s.footerLink}>
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
                <Link href={l.href} className="footer-link" style={s.footerLink}>
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

        {/* Portails voisins du projet, chacun sur son sous-domaine */}
        <div>
          <h3 style={s.footerColTitle}>{t.footer.productsTitle}</h3>
          <ul style={s.footerList}>
            {SITE_APPS.map((a) => (
              <li key={a.url}>
                <a href={a.url} className="footer-link" style={s.footerLink} target="_blank" rel="noopener noreferrer">
                  {lang === 'en' ? (a.labelEn ?? a.label) : a.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Liens vers le portail officiel de l'aéroport FIH */}
        <div>
          <h3 style={s.footerColTitle}>Aéroport FIH</h3>
          <ul style={s.footerList}>
            {FIH_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="footer-link" style={f.fihLink} target="_blank" rel="noopener noreferrer">
                  {l.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bannière site officiel */}
      <div style={s.footerBottom}>
        <a className="footer-link" style={f.fihBanner} href="https://fih-rva.com" target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fih-logo.png" alt="RVA" width={22} height={22} style={{ objectFit: 'contain', background: '#fff', borderRadius: 6, padding: 2 }} />
          <span>Site officiel de l'Aéroport International de Kinshasa : <strong>fih-rva.com</strong></span>
          <span style={{ opacity: 0.7 }}>↗</span>
        </a>
        <div className="sf-social" style={{ marginTop: 16 }}>
          {SOCIALS.map(({ name, url, Icon }) =>
            url ? (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="sf-social-item" aria-label={name}>
                <Icon />
              </a>
            ) : (
              // Compte pas encore ouvert : l'icône reste décorative plutôt que
              // de devenir un lien qui ne mène nulle part.
              <span key={name} className="sf-social-item" title={name} aria-hidden="true">
                <Icon />
              </span>
            ),
          )}
        </div>
        <span style={{ marginTop: 12, display: 'block' }}>© {year} African Transport Systems. {t.footer.rights}</span>
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
  fihLink: { color: 'var(--content-secondary)', fontSize: 14, fontWeight: 500 },
  fihBanner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--content-secondary)',
    fontSize: 13,
    fontWeight: 500,
  },
};
