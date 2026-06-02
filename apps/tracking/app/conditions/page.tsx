'use client';

import { useLang } from '@/i18n/LanguageProvider';
import { ContentPage } from '@/components/ContentPage';

const UPDATED = '2026-06-02';

export default function TermsPage() {
  const { t } = useLang();
  return (
    <ContentPage
      crumb={t.breadcrumb.terms}
      title={t.terms.title}
      intro={t.terms.intro}
      sections={t.terms.sections}
      updatedLabel={t.terms.updated}
      updatedDate={UPDATED}
    />
  );
}
