'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';
import { IconMail } from './marks';
import { COMPANY, CONTACT, DESCRIPTION, requestMailto } from '@/lib/trust-data';

/**
 * Habillage commun du Trust Center : barre du haut (marque, bouton de demande
 * d'accès), bandeau de présentation sur fond teinté terminé par une vague,
 * onglets de section, contenu, pied de page.
 */

const TABS = [
  { href: '/', label: 'Aperçu' },
  { href: '/resources', label: 'Ressources' },
  { href: '/controls', label: 'Contrôles' },
  { href: '/subprocessors', label: 'Sous-traitants' },
];

export function TrustShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="tc-root">
      <header className="tc-top">
        <div className="tc-top-inner">
          <Link href="/" className="tc-top-brand" aria-label={`${COMPANY} Trust Center`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="tc-top-logo" />
            <span className="tc-top-sep" aria-hidden="true" />
            <span className="tc-top-title">{COMPANY} Trust Center</span>
          </Link>
          <a href={requestMailto("demande d'accès")} className="tc-btn">Demander l’accès</a>
        </div>
      </header>

      <section className="tc-hero">
        <div className="tc-hero-inner">
          <h1 className="tc-h1">{COMPANY}</h1>
          <p className="tc-desc">{DESCRIPTION}</p>
          <a href={`mailto:${CONTACT}`} className="tc-mail">
            <IconMail />
            <span>{CONTACT}</span>
          </a>
        </div>
        <svg className="tc-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0,50 C260,95 520,0 780,35 C1040,70 1240,90 1440,25 L1440,90 L0,90 Z" fill="var(--bg-screen)" />
        </svg>
      </section>

      <nav className="tc-tabs" aria-label="Sections du Trust Center">
        <div className="tc-tabs-inner">
          {TABS.map((t) => {
            const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={`tc-tab${active ? ' tc-tab-on' : ''}`} aria-current={active ? 'page' : undefined}>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="tc-main">{children}</main>

      <SiteFooter />
    </div>
  );
}
