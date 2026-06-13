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
      <main style={shared.main}>
        <h1 style={shared.contentTitle}>{t.support.title}</h1>
        <p style={shared.contentIntro}>{t.support.intro}</p>

        <section style={s.contactCard}>
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
    borderRadius: 14,
    padding: '24px 26px',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  contactList: { listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  contactItem: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 16 },
  contactIcon: { display: 'inline-flex', color: 'var(--primary)' },
  contactValue: { color: 'var(--text)' },

  faqList: { display: 'flex', flexDirection: 'column', gap: 12 },
  faqItem: {
    ...glass,
    borderRadius: 12,
    padding: '16px 20px',
  },
  faqQ: { fontSize: 16, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', listStyle: 'none' },
  faqA: { margin: '12px 0 0', color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 },
};
