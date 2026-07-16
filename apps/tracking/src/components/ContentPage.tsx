'use client';

import type { LegalSection } from '../i18n/translations';
import { Header } from './Header';
import { Footer } from './Footer';
import { Breadcrumb } from './Breadcrumb';
import { shared as s } from './theme';

interface ContentPageProps {
  crumb: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  updatedLabel?: string;
  updatedDate?: string;
}

// Page de contenu générique : À propos, mentions légales, confidentialité, etc.
export function ContentPage({ crumb, title, intro, sections, updatedLabel, updatedDate }: ContentPageProps) {
  return (
    <div style={s.shell}>
      <Header />
      <Breadcrumb current={crumb} />
      <main className="page-main text-main" style={{ ...s.main, ...s.mainText }}>
        <h1 style={s.contentTitle}>{title}</h1>
        <p style={s.contentIntro}>{intro}</p>
        {updatedLabel && updatedDate ? (
          <p style={s.updated}>
            {updatedLabel} : {updatedDate}
          </p>
        ) : null}

        <div className="content-card" style={s.contentCard}>
          {sections.map((sec) => (
            <section key={sec.heading} style={s.section}>
              <h2 style={s.sectionHeading}>{sec.heading}</h2>
              {sec.body.map((para, i) => (
                <p key={i} style={s.paragraph}>
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
