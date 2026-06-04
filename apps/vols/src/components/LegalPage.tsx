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

/** Page de contenu légal autonome (conditions, confidentialité, cookies). */
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
          <Link href="/conditions" style={s.footerLink}>Conditions d’utilisation</Link>
          <Link href="/confidentialite" style={s.footerLink}>Confidentialité</Link>
          <Link href="/cookies" style={s.footerLink}>Cookies</Link>
        </nav>
        <p style={s.copyright}>© 2026 ATS Handling · Police Bagage</p>
      </div>
    </main>
  );
}

const glass: CSSProperties = {
  background: 'var(--glass)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: '1px solid var(--glass-border)',
};

const s: Record<string, CSSProperties> = {
  shell: { minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '32px 20px 48px' },
  shellMobile: { padding: '18px 12px 32px' },
  container: { width: '100%', maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 14 },
  back: { color: '#93c5fd', fontSize: 14, fontWeight: 700, alignSelf: 'flex-start' },
  title: { margin: '6px 0 0', fontSize: 34, fontWeight: 800, letterSpacing: -0.4 },
  titleMobile: { fontSize: 25 },
  intro: { margin: 0, color: 'var(--muted)', fontSize: 15, lineHeight: 1.5 },
  updated: { margin: 0, color: 'var(--muted)', fontSize: 13, fontWeight: 600 },
  card: {
    ...glass,
    borderRadius: 14,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    boxShadow: '0 14px 40px rgba(0,0,0,0.3)',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  heading: { margin: 0, fontSize: 18, fontWeight: 700 },
  paragraph: { margin: 0, color: '#e2e8f0', fontSize: 14.5, lineHeight: 1.6 },
  footerNav: { display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  footerLink: { color: 'var(--muted)', fontSize: 13, fontWeight: 600 },
  copyright: { color: 'var(--muted)', fontSize: 12, textAlign: 'center', margin: '4px 0 0' },
};
