'use client';

import { useLang } from '@/i18n/LanguageProvider';
import { ContentPage } from '@/components/ContentPage';

const UPDATED = '2026-06-02';

export default function PrivacyPage() {
  const { t } = useLang();
  return (
    <ContentPage
      crumb={t.breadcrumb.privacy}
      title={t.privacy.title}
      intro={t.privacy.intro}
      sections={t.privacy.sections}
      updatedLabel={t.privacy.updated}
      updatedDate={UPDATED}
    />
  );
}
