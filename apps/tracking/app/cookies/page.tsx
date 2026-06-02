'use client';

import { useLang } from '@/i18n/LanguageProvider';
import { ContentPage } from '@/components/ContentPage';

const UPDATED = '2026-06-02';

export default function CookiesPage() {
  const { t } = useLang();
  return (
    <ContentPage
      crumb={t.breadcrumb.cookies}
      title={t.cookies.title}
      intro={t.cookies.intro}
      sections={t.cookies.sections}
      updatedLabel={t.cookies.updated}
      updatedDate={UPDATED}
    />
  );
}
