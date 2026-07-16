'use client';

import Link from 'next/link';
import { useLang } from '../i18n/LanguageProvider';
import { shared as s } from './theme';

export function Breadcrumb({ current }: { current: string }) {
  const { t } = useLang();
  return (
    <div className="breadcrumb" style={s.breadcrumb}>
      <Link href="/" style={s.crumbLink}>
        {t.breadcrumb.home}
      </Link>
      <span style={s.crumbSep}>/</span>
      <span>{current}</span>
    </div>
  );
}
