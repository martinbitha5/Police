import type { ReactElement } from 'react';
import Link from 'next/link';
import { SITE_APPS } from '@/lib/site-apps';

/**
 * Pied de page en colonnes, commun au tableau des vols et aux pages légales.
 *
 * Même gabarit que les autres portails du projet : colonnes de liens, puis un
 * filet, la marque et le partenaire, enfin les réseaux et la ligne légale
 * centrés. La mise en page (4 colonnes → 2 → 1) est portée par les classes
 * `.sf-*` de globals.css, pas par un test de largeur en JS : le premier rendu
 * serveur est déjà juste sur téléphone.
 */

const YEAR = new Date().getFullYear();

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

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

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Produits',
    links: SITE_APPS.map((a) => ({ label: a.label, href: a.url, external: true })),
  },
  {
    title: 'Informations',
    links: [
      { label: 'Conditions d’utilisation', href: '/conditions' },
      { label: 'Confidentialité', href: '/confidentialite' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Mentions légales', href: '/mentions-legales' },
    ],
  },
  {
    title: 'Partenaires',
    links: [
      { label: 'Aéroport International de Kinshasa', href: 'https://fih-rva.com', external: true },
      { label: 'ATS Handling RDC', href: 'https://www.ats-handling-rdc.com/', external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="sf">
      <div className="sf-inner">
        <div className="sf-cols" data-rv-auto>
          {COLUMNS.map((col) => (
            <div key={col.title} className="sf-col">
              <h3 className="sf-col-title">{col.title}</h3>
              <ul className="sf-list">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="ft-link">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="ft-link">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="sf-bottom">
          <div className="sf-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/air.png" alt="Air Congo" className="sf-brand-logo" />
            <span className="sf-brand-name">Vols du jour</span>
          </div>

          <div className="sf-partners">
            <span className="sf-partner-label">Partenaire</span>
            <span className="sf-partner-pill">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/air.png" alt="Air Congo" className="sf-partner-logo" />
            </span>
          </div>
        </div>

        {/* Bloc centré à toutes les largeurs : les icônes, puis la ligne
            légale qui se replie d'elle-même sur les petits écrans. */}
        <div className="sf-legal">
          <div className="sf-social">
            {SOCIALS.map(({ name, url, Icon }) =>
              url ? (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sf-social-item"
                  aria-label={name}
                >
                  <Icon />
                </a>
              ) : (
                // Compte pas encore ouvert : l'icône reste décorative plutôt
                // que de devenir un lien qui ne mène nulle part.
                <span key={name} className="sf-social-item" title={name} aria-hidden="true">
                  <Icon />
                </span>
              ),
            )}
          </div>

          <div className="sf-legal-text">
            <span className="sf-copy">© {YEAR} African Transport Systems</span>
            <span className="sf-legal-sep" aria-hidden="true" />
            <span className="sf-copy">Informations fournies à titre indicatif</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
