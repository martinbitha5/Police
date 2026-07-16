'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalPageProps {
  title: string;
  intro: string;
  updated?: string;
  sections: LegalSection[];
}

/** Page de contenu légal autonome (conditions, confidentialité, cookies) — thème clair Wise. */
export function LegalPage({ title, intro, updated, sections }: LegalPageProps) {
  const isMobile = useIsMobile();
  return (
    <main style={isMobile ? { ...s.shell, ...s.shellMobile } : s.shell}>
      <div style={s.container}>
        <Link href="/" style={s.back}>
          ← Retour aux vols
        </Link>

        <h1 style={isMobile ? { ...s.title, ...s.titleMobile } : s.title}>{title}</h1>
        <p style={s.intro}>{intro}</p>
        {updated ? <p style={s.updated}>Dernière mise à jour : {updated}</p> : null}

        <div style={s.card}>
          {sections.map((sec) => (
            <section key={sec.heading} style={s.section}>
              <h2 style={s.heading}>{sec.heading}</h2>
              {sec.body.map((para, i) => (
                <p key={i} style={s.paragraph}>
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <nav style={s.footerNav}>
          <Link href="/conditions" className="fl-footer-link" style={s.footerLink}>Conditions d’utilisation</Link>
          <Link href="/confidentialite" className="fl-footer-link" style={s.footerLink}>Confidentialité</Link>
          <Link href="/cookies" className="fl-footer-link" style={s.footerLink}>Cookies</Link>
        </nav>
        <p style={s.copyright}>© 2026 ATS Handling · Police Bagage</p>
      </div>
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  shell: { minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '40px 20px 56px', background: 'var(--bg-screen)' },
  shellMobile: { padding: '20px 16px 36px' },
  container: { width: '100%', maxWidth: 'var(--container-text)', display: 'flex', flexDirection: 'column', gap: 14 },
  back: {
    color: 'var(--content-link)',
    fontSize: 14,
    fontWeight: 600,
    alignSelf: 'flex-start',
    textDecoration: 'underline',
    textUnderlineOffset: '0.3em',
  },
  title: { margin: '10px 0 0', fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--content-primary)' },
  titleMobile: { fontSize: 26 },
  intro: { margin: 0, color: 'var(--content-secondary)', fontSize: 16, lineHeight: 1.5 },
  updated: { margin: 0, color: 'var(--content-tertiary)', fontSize: 13, fontWeight: 500 },
  card: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-neutral)',
    borderRadius: 16,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  heading: { margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--content-primary)' },
  paragraph: { margin: 0, color: 'var(--content-secondary)', fontSize: 15, lineHeight: 1.6 },
  footerNav: { display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  footerLink: { color: 'var(--content-secondary)', fontSize: 13, fontWeight: 500 },
  copyright: { color: 'var(--content-tertiary)', fontSize: 12, textAlign: 'center', margin: '4px 0 0' },
};
