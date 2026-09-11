import type { Status } from '@/lib/trust-data';

/** Petits glyphes du Trust Center : coche, cadenas, chevron, enveloppe. */

function svg(children: React.ReactNode, size: number) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function IconCheck({ size = 14 }: { size?: number }) {
  return svg(<path d="M20 6 9 17l-5-5" />, size);
}
export function IconLock({ size = 14 }: { size?: number }) {
  return svg(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>, size);
}
export function IconChevron({ size = 16 }: { size?: number }) {
  return svg(<path d="m9 6 6 6-6 6" />, size);
}
export function IconMail({ size = 15 }: { size?: number }) {
  return svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>, size);
}
export function IconEye({ size = 14 }: { size?: number }) {
  return svg(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>, size);
}
export function IconSearch({ size = 15 }: { size?: number }) {
  return svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>, size);
}

/** Point d'état : vert quand la mesure est en place, gris quand elle est en cours. */
export function StatusDot({ status }: { status: Status }) {
  return <span className={`tc-dot${status === 'en place' ? ' tc-dot-ok' : ' tc-dot-wip'}`} role="img" aria-label={status} />;
}

/** Étiquette « en cours », discrète, uniquement quand la mesure n'est pas en place. */
export function Tag({ status }: { status: Status }) {
  return status === 'en cours' ? <span className="tc-tag">en cours</span> : null;
}

/** Marque ronde avec une lettre, en guise de logo de sous-traitant. */
export function Mark({ text }: { text: string }) {
  return <span className="tc-mark" aria-hidden="true">{text}</span>;
}
