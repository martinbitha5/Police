'use client';

import { useLang } from '@/i18n/LanguageProvider';
import { ContentPage } from '@/components/ContentPage';

const UPDATED = '2026-06-02';

export default function MentionsPage() {
  const { t } = useLang();
  return (
    <ContentPage
      crumb={t.breadcrumb.mentions}
      title={t.mentions.title}
      intro={t.mentions.intro}
      sections={t.mentions.sections}
      updatedLabel={t.mentions.updated}
      updatedDate={UPDATED}
    />
  );
}
