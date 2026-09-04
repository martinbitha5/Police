/**
 * Design system « registre Uber » de l'application mobile.
 *
 * Porté depuis le projet marketplace (packages `tokens` et `ui`) avec deux
 * simplifications : un seul thème, clair, et pas de ThemeProvider. Le thème est
 * une constante et `useTheme()` la renvoie telle quelle, pour que le code porté
 * depuis marketplace reste copiable sans modification.
 *
 * Principe structurel : noir et blanc pour la structure, une seule couleur
 * saturée (le bleu) pour l'accent. La couleur ne décore jamais, elle signale.
 * Toute couleur codée en dur dans un écran est une régression.
 */

// ---------------------------------------------------------------------------
// Palette brute. Aucun écran ne l'importe : passer par `colors`.
// ---------------------------------------------------------------------------

/** Neutres, gris purs non teintés. */
export const neutral = {
  /** Fond principal. */
  0: '#FFFFFF',
  /** Fond de page alterné, champ au repos. */
  50: '#FAFAFA',
  /** Surface de carte au repos. */
  100: '#F5F5F5',
  /** Séparateurs, bordures douces. */
  200: '#EEEEEE',
  /** Bordures d'input. */
  300: '#E0E0E0',
  /** Icônes désactivées. */
  400: '#C7C7C7',
  /** Placeholder. */
  500: '#9E9E9E',
  /** Texte secondaire, 4,6:1 sur blanc, le minimum acceptable. */
  600: '#757575',
  /** Texte secondaire renforcé. */
  700: '#545454',
  /** Texte courant sur surface teintée. */
  800: '#333333',
  /** Surface sombre haute. */
  900: '#1F1F1F',
  /** Texte principal, bouton primaire. */
  950: '#0A0A0A',
} as const;

/**
 * Bleu d'accent.
 *
 * Le 500 est la couleur qu'on montre (3,8:1 sur blanc, jamais de texte
 * courant dessus), le 600 est celle qu'on peut lire (liens, états actifs,
 * blanc dessus = 5,5:1). Les confondre produit des liens illisibles.
 */
export const blue = {
  50: '#EAF3FF',
  100: '#D0E4FF',
  200: '#A6CCFF',
  300: '#6FADFF',
  400: '#2E8BFF',
  500: '#007FFF',
  600: '#0064D6',
  700: '#004FA8',
  800: '#003B7D',
} as const;

/** Jaune d'accent secondaire. Ne porte jamais de texte blanc. */
export const yellow = {
  100: '#FEF6CC',
  400: '#F7D618',
  600: '#8A6D00',
} as const;

/** Sémantiques, thème clair. Chaque ton tient 4,5:1 avec du blanc dessus. */
export const semantic = {
  success: '#067647',
  warning: '#B25E09',
  danger: '#D3232F',
  info: blue[600],
} as const;

// ---------------------------------------------------------------------------
// Tokens sémantiques de couleur
// ---------------------------------------------------------------------------

export interface ThemeColors {
  // Surfaces
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  surfaceInverse: string;
  scrim: string;

  // Texte
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textOnPrimary: string;
  /** Texte posé sur `scrim` ou `overlay`. */
  textOnScrim: string;

  // Marque
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimarySoft: string;

  // Accent
  accent: string;
  accentSoft: string;
  onAccentSoft: string;
  textOnAccent: string;

  /** Jaune : notes, pastilles d'attention non sémantiques. */
  rating: string;
  /** Toujours du texte sombre sur `rating`. */
  onRating: string;

  // Sémantiques
  success: string;
  successSoft: string;
  onSuccessSoft: string;
  warning: string;
  warningSoft: string;
  onWarningSoft: string;
  danger: string;
  dangerSoft: string;
  onDangerSoft: string;
  info: string;
  infoSoft: string;
  onInfoSoft: string;

  // Structure
  border: string;
  borderStrong: string;
  divider: string;
  skeleton: string;
  skeletonHighlight: string;

  // États
  disabled: string;
  disabledText: string;
  overlay: string;
  shadow: string;
  /** Anneau de focus clavier, visible sur `primary` comme sur `surface`. */
  focusRing: string;
}

/**
 * Thème clair, le seul de l'application.
 *
 * Le bouton d'action principal est noir, jamais bleu. Le bleu reste réservé
 * aux liens, aux états actifs et aux pastilles de comptage.
 */
export const colors: ThemeColors = {
  background: neutral[0],
  surface: neutral[0],
  surfaceRaised: neutral[0],
  surfaceSunken: neutral[50],
  surfaceInverse: neutral[950],
  scrim: 'rgba(0, 0, 0, 0.55)',

  text: neutral[950],
  textSecondary: neutral[600],
  textMuted: neutral[500],
  textInverse: neutral[0],
  textOnPrimary: neutral[0],
  textOnScrim: neutral[0],

  primary: neutral[950],
  primaryPressed: neutral[800],
  primarySoft: neutral[50],
  onPrimarySoft: neutral[950],

  accent: blue[600],
  accentSoft: blue[50],
  onAccentSoft: blue[800],
  textOnAccent: neutral[0],

  rating: yellow[400],
  onRating: neutral[950],

  success: semantic.success,
  // Fonds `Soft` et premiers plans `on*Soft` : tons dédiés, calibrés à 4,5:1
  // sur leur fond. Un texte sur fond doux utilise toujours `on*Soft`.
  successSoft: '#E1EFE9',
  onSuccessSoft: semantic.success,
  warning: semantic.warning,
  warningSoft: '#F6ECE1',
  onWarningSoft: '#975008',
  danger: semantic.danger,
  dangerSoft: '#FAE5E6',
  onDangerSoft: '#B31E28',
  info: semantic.info,
  infoSoft: blue[50],
  onInfoSoft: blue[800],

  border: neutral[200],
  borderStrong: neutral[300],
  divider: neutral[100],
  skeleton: neutral[50],
  skeletonHighlight: neutral[100],

  disabled: neutral[50],
  disabledText: neutral[400],
  overlay: 'rgba(0, 0, 0, 0.45)',
  shadow: '#000000',
  focusRing: blue[500],
};

/** Ton d'un statut. Porté par un libellé, jamais par la couleur seule. */
export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

// ---------------------------------------------------------------------------
// Échelles
// ---------------------------------------------------------------------------

/** Rythme 4 pt. Toute valeur d'espacement doit venir d'ici. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

/** Marge horizontale standard des écrans. */
export const screenPadding = spacing.base;

/**
 * Rayons : il n'y en a que deux.
 *
 * 8 pour tout ce qui est rectangulaire (cartes, champs, boutons pleine
 * largeur), la pilule pour ce qui se dimensionne sur son contenu. Les anciens
 * noms (`md`, `lg`, `xl`) pointent tous sur 8 pour que le code porté reste
 * valide sans réécriture.
 */
export const radius = {
  none: 0,
  sm: 8,
  md: 8,
  lg: 8,
  xl: 8,
  '2xl': 8,
  pill: 500,
} as const;

export const borderWidth = {
  hairline: 1,
  thin: 1.5,
  thick: 2,
} as const;

/** Tailles d'icônes tokenisées, jamais de valeur arbitraire. */
export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
} as const;

/** Plancher de cible tactile. */
export const hitTarget = 44;

/** Hauteur des boutons pleine largeur. */
export const controlHeight = 56;

export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 20,
  overlay: 40,
  modal: 100,
  toast: 1000,
} as const;

/**
 * Élévation.
 *
 * On sépare par des filets et des aplats gris, presque jamais par des ombres :
 * `0` et `1` couvrent la quasi-totalité des cas. `3` est réservé à ce qui
 * flotte vraiment au-dessus du contenu : la barre d'onglets et le toast.
 */
export interface ElevationStyle {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

export const elevation: Record<0 | 1 | 2 | 3, ElevationStyle> = {
  0: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  1: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  2: {
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  3: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
};

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type ElevationLevel = keyof typeof elevation;

// ---------------------------------------------------------------------------
// Typographie
// ---------------------------------------------------------------------------

/**
 * Deux familles, deux rôles : Figtree pour les titres et les boutons, Inter
 * pour le courant. Les noms sont exactement ceux exportés par
 * `@expo-google-fonts/*` et chargés via `FONT_ASSETS` (voir `fonts.ts`).
 */
export const fontFamily = {
  brand: 'Figtree_800ExtraBold',
  brandRegular: 'Figtree_600SemiBold',

  headingBold: 'Figtree_700Bold',
  headingSemi: 'Figtree_600SemiBold',
  heading: 'Figtree_500Medium',

  bodyBold: 'Inter_700Bold',
  bodySemi: 'Inter_600SemiBold',
  bodyMedium: 'Inter_500Medium',
  body: 'Inter_400Regular',
} as const;

export const fontSize = {
  xxs: 11,
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 40,
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const letterSpacing = {
  tighter: -0.6,
  tight: -0.3,
  normal: 0,
  wide: 0.4,
  wider: 1.2,
} as const;

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

const style = (
  family: string,
  size: number,
  lh: number,
  ls: number = letterSpacing.normal,
): TextStyleToken => ({
  fontFamily: family,
  fontSize: size,
  lineHeight: Math.round(size * lh),
  letterSpacing: ls,
});

/** Resserrement des gros titres (24 pt et plus), -0,02 em. */
const tighten = (size: number) => Math.round(size * -0.02 * 10) / 10;

/**
 * Rôles de texte. Un écran compose ces rôles, il ne redéfinit jamais
 * fontSize ou fontFamily à la main.
 */
export const textStyles = {
  /** Marque, splash uniquement. */
  brand: style(fontFamily.brand, fontSize['3xl'], 1.2, tighten(fontSize['3xl'])),
  brandSmall: style(fontFamily.brand, fontSize.lg, 1.2, tighten(fontSize.lg)),

  /** Titre de héros. */
  display: style(fontFamily.headingBold, fontSize['3xl'], 1.2, tighten(fontSize['3xl'])),
  /** Titre d'écran, gros et aligné à gauche. Numéro de vol. */
  h1: style(fontFamily.headingBold, fontSize['2xl'], 1.29, tighten(fontSize['2xl'])),
  /** Titre de section, nom du passager. */
  h2: style(fontFamily.headingBold, fontSize.xl, 1.33, tighten(fontSize.xl)),
  /** Titre de carte. */
  h3: style(fontFamily.headingSemi, fontSize.md, 1.33),

  body: style(fontFamily.body, fontSize.base, 1.5),
  bodyStrong: style(fontFamily.bodySemi, fontSize.base, 1.5),
  bodySmall: style(fontFamily.body, fontSize.sm, 1.43),

  label: style(fontFamily.bodyMedium, fontSize.sm, 1.43),
  labelStrong: style(fontFamily.bodySemi, fontSize.sm, 1.43),
  caption: style(fontFamily.body, fontSize.xs, 1.33),

  /** Puces et badges, en casse normale : aucun composant n'impose de majuscules. */
  overline: style(fontFamily.bodySemi, fontSize.xs, 1.33),

  /** Compteurs et montants, Figtree + chiffres tabulaires côté composant. */
  price: style(fontFamily.headingBold, fontSize.base, 1.5),
  priceLarge: style(fontFamily.headingBold, fontSize.xl, 1.33, tighten(fontSize.xl)),
  priceSmall: style(fontFamily.headingSemi, fontSize.sm, 1.43),

  button: style(fontFamily.headingSemi, fontSize.base, 1.5),
  buttonSmall: style(fontFamily.headingSemi, fontSize.sm, 1.43),
} as const;

/** À appliquer sur tout texte numérique susceptible de changer en place. */
// Pas de `as const` : react-native attend un FontVariant[] mutable.
export const tabularNums: { fontVariant: 'tabular-nums'[] } = {
  fontVariant: ['tabular-nums'],
};

export type TextVariant = keyof typeof textStyles;

// ---------------------------------------------------------------------------
// Mouvement (API `Animated` de React Native, pilote natif)
// ---------------------------------------------------------------------------

export const duration = {
  instant: 100,
  fast: 180,
  base: 260,
  slow: 420,
  /** Sortie plus rapide que l'entrée. */
  exit: 170,
} as const;

/** Courbes de Bézier, à passer à `Easing.bezier(...easing.out)`. */
export const easing = {
  out: [0.16, 1, 0.3, 1] as const,
  in: [0.7, 0, 0.84, 0] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  emphasized: [0.2, 0, 0, 1] as const,
} as const;

/** Ressorts pour `Animated.spring` (modèle physique stiffness/damping/mass). */
export const spring = {
  /** Retour de pression. */
  snappy: { damping: 26, stiffness: 420, mass: 0.7 },
  /** Transitions, feuilles. */
  base: { damping: 18, stiffness: 220, mass: 1 },
  /** Grandes entrées. */
  gentle: { damping: 22, stiffness: 140, mass: 1.1 },
} as const;

/** Échelle appliquée à la pression. Jamais de translation : cela déplace le layout. */
export const pressScale = 0.97;

/** Cascade d'entrée de liste : 40 ms par élément, plafonnée à 8. */
export const stagger = {
  step: 40,
  maxItems: 8,
  delayFor: (index: number) => Math.min(index, 8) * 40,
} as const;

// ---------------------------------------------------------------------------
// Thème
// ---------------------------------------------------------------------------

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  screenPadding: typeof screenPadding;
  radius: typeof radius;
  borderWidth: typeof borderWidth;
  iconSize: typeof iconSize;
  hitTarget: typeof hitTarget;
  controlHeight: typeof controlHeight;
  zIndex: typeof zIndex;
  elevation: typeof elevation;
  text: typeof textStyles;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  lineHeight: typeof lineHeight;
  letterSpacing: typeof letterSpacing;
  tabularNums: typeof tabularNums;
  duration: typeof duration;
  easing: typeof easing;
  spring: typeof spring;
  pressScale: typeof pressScale;
  stagger: typeof stagger;
}

/** Le thème, en un seul exemplaire. */
export const theme: Theme = {
  colors,
  spacing,
  screenPadding,
  radius,
  borderWidth,
  iconSize,
  hitTarget,
  controlHeight,
  zIndex,
  elevation,
  text: textStyles,
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  tabularNums,
  duration,
  easing,
  spring,
  pressScale,
  stagger,
};

/**
 * Accès au thème. Renvoie la constante : il n'y a ni provider ni bascule.
 * Conservé sous forme de hook pour que le code porté depuis marketplace reste
 * copiable tel quel.
 */
export function useTheme(): Theme {
  return theme;
}
