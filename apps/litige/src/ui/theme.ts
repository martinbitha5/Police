import type { CSSProperties } from 'react';

// Tokens de style partagés par l'app litige — design system "Wise" (thème clair).
// Les noms "glass" sont conservés pour compatibilité : ils rendent
// des surfaces blanches plates (aucun flou, aucune ombre).
export const glass: CSSProperties = {
  background: 'var(--bg-elevated)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--border-neutral)',
};

export const glassStrong: CSSProperties = { ...glass };

// Carte blanche UI : radius 16, bordure fine, pas d'ombre par défaut.
export const card: CSSProperties = {
  ...glass,
  borderRadius: 16,
  padding: 20,
};

// Bouton primaire : pilule verte, texte vert forêt.
export const btnPrimary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: 'var(--interactive-accent)',
  color: 'var(--interactive-control)',
  border: 'none',
  borderRadius: 9999,
  padding: '10px 20px',
  fontWeight: 600,
  fontSize: 15,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

// Bouton secondaire : pilule transparente, bordure vert forêt.
export const btnGhost: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: 'transparent',
  color: 'var(--interactive-primary)',
  border: '1px solid var(--interactive-primary)',
  borderRadius: 9999,
  padding: '10px 20px',
  fontWeight: 600,
  fontSize: 15,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

export const input: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-neutral)',
  borderRadius: 10,
  padding: '10px 12px',
  color: 'var(--content-primary)',
  fontSize: 14,
  colorScheme: 'light',
  width: '100%',
};

export const label: CSSProperties = { fontSize: 13, color: 'var(--content-secondary)', fontWeight: 600 };

export const sectionHeading: CSSProperties = {
  fontSize: 13,
  letterSpacing: '-0.01em',
  color: 'var(--content-secondary)',
  margin: '8px 0 14px',
  fontWeight: 600,
};

// Pastille pilule — à combiner avec badgeTone/DISPUTE_BADGE pour les couleurs.
export const badge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: 'none',
  borderRadius: 9999,
  padding: '3px 11px',
  fontSize: 12,
  fontWeight: 600,
};

// Tons de pastilles (fond + texte), contraste AA sur fond clair.
export const badgeTone = {
  positive: { background: 'var(--positive-bg)', color: 'var(--positive)' } as CSSProperties,
  warning: { background: 'var(--warning-bg)', color: 'var(--warning-content)' } as CSSProperties,
  negative: { background: 'var(--negative-bg)', color: 'var(--negative)' } as CSSProperties,
  neutral: { background: 'var(--bg-neutral)', color: 'var(--brand-forest)' } as CSSProperties,
};

// Pastilles par statut de litige : ouvert = jaune, en cours = neutre, résolu = vert.
export const DISPUTE_BADGE: Record<string, CSSProperties> = {
  open: badgeTone.warning,
  investigating: badgeTone.neutral,
  resolved: badgeTone.positive,
};

// Couleurs par statut de litige (texte seul) — conservé pour compatibilité.
export const DISPUTE_COLOR: Record<string, string> = {
  open: '#4A3B1C',
  investigating: '#163300',
  resolved: '#054D28',
};
