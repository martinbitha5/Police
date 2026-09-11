import type { SVGProps } from 'react';

// Jeu d'icônes en SVG (trait) — pas d'emojis, rendu net et professionnel.
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ref: _ref, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

export function IconPlane(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M10.2 3.3a1.6 1.6 0 0 1 3.1 0L14.6 9l6.3 2.6a1 1 0 0 1 .6.9v1l-6.9-1.4-.6 4.3 2.4 1.7v1.3l-3.7-1.1-1.1 1.6-1.1-1.6-3.7 1.1v-1.3l2.4-1.7-.6-4.3L2.5 13.5v-1a1 1 0 0 1 .6-.9L9.4 9z" />
    </svg>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export function IconBag(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="7.5" width="17" height="13" rx="2.5" />
      <path d="M9 7.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2.5" />
      <path d="M8.5 20.5v1M15.5 20.5v1" />
    </svg>
  );
}

export function IconLogin(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 16l4-4-4-4" />
      <path d="M14 12H4" />
    </svg>
  );
}
