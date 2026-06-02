'use client';

import { useLang } from '@/i18n/LanguageProvider';
import { ContentPage } from '@/components/ContentPage';

export default function AboutPage() {
  const { t } = useLang();
  return (
    <ContentPage
      crumb={t.breadcrumb.about}
      title={t.about.title}
      intro={t.about.intro}
      sections={t.about.sections}
    />
  );
}
