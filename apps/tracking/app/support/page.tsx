'use client';

import type { CSSProperties } from 'react';
import { useLang } from '@/i18n/LanguageProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { glass, shared } from '@/components/theme';
import { IconMail, IconPhone, IconClock } from '@/components/icons';

export default function SupportPage() {
  const { t } = useLang();
  return (
    <div style={shared.shell}>
      <Header />
      <Breadcrumb current={t.breadcrumb.support} />
      <main className="page-main text-main" style={{ ...shared.main, ...shared.mainText }}>
        <h1 style={shared.contentTitle}>{t.support.title}</h1>
        <p style={shared.contentIntro}>{t.support.intro}</p>

        <section className="content-card" style={s.contactCard}>
          <h2 style={shared.sectionHeading}>{t.support.contactTitle}</h2>
          <p style={shared.paragraph}>{t.support.contactText}</p>
          <ul style={s.contactList}>
            <li style={s.contactItem}>
              <span style={s.contactIcon}><IconMail size={18} /></span>
              <a href={`mailto:${t.support.email}`} style={s.contactValue}>
                {t.support.email}
              </a>
            </li>
            <li style={s.contactItem}>
              <span style={s.contactIcon}><IconPhone size={18} /></span>
              <span style={s.contactValue}>{t.support.phone}</span>
            </li>
            <li style={s.contactItem}>
              <span style={s.contactIcon}><IconClock size={18} /></span>
              <span style={s.contactValue}>{t.support.hours}</span>
            </li>
          </ul>
        </section>

        <h2 style={{ ...shared.sectionHeading, fontSize: 24, marginTop: 8 }}>{t.support.faqTitle}</h2>
        <div style={s.faqList}>
          {t.support.faq.map((item, i) => (
            <details key={i} style={s.faqItem}>
              <summary style={s.faqQ}>{item.q}</summary>
              <p style={s.faqA}>{item.a}</p>
            </details>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  contactCard: {
    ...glass,
    borderRadius: 'var(--radius-md)',
    padding: '24px 26px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  contactList: { listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 },
  contactItem: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 16 },
  // Icônes posées dans des cercles teintés — recette Wise
  contactIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-neutral)',
    color: 'var(--interactive-primary)',
    boxShadow: 'inset 0 0 0 1px var(--border-neutral)',
  },
  contactValue: { color: 'var(--content-primary)' },

  faqList: { display: 'flex', flexDirection: 'column', gap: 12 },
  faqItem: {
    ...glass,
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
  },
  faqQ: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    color: 'var(--content-primary)',
    cursor: 'pointer',
    listStyle: 'none',
  },
  faqA: { margin: '12px 0 0', color: 'var(--content-secondary)', fontSize: 15, lineHeight: 1.6 },
};
