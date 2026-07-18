import { Platform, type ViewStyle } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Thème Wise (Neptune, clair) — aligné sur le dashboard web.
// Source des valeurs : apps/web/app/globals.css (docs/wise-design-spec.md).
//
// Règle de contraste du web reprise ici : le vert vif #9FE870 est TOUJOURS un
// fond portant du texte forêt (#163300), jamais du blanc. Or sur mobile,
// plusieurs tokens servent de fond de pastille avec un glyphe blanc
// (colors.onPrimary). Les tokens qui jouent ce rôle — accent, warning — sont
// donc des variantes ASSOMBRIES de la teinte Wise correspondante, pour rester
// lisibles en blanc. Les autres reprennent la valeur web à l'identique.
// ─────────────────────────────────────────────────────────────
export const colors = {
  bg: '#f7f9f5', // fond d'écran : blanc cassé à peine teinté forêt
  surface: '#ffffff', // --bg-elevated (cartes)
  surfaceAlt: '#ecefeb', // --bg-neutral rgba(22,51,0,.08) aplati sur blanc
  border: '#e2e2e2', // --border-neutral rgba(14,15,12,.12) aplati sur blanc
  text: '#0e0f0c', // --content-primary
  muted: '#454745', // --content-secondary
  primary: '#163300', // --interactive-primary (vert forêt)
  primaryDark: '#0d1f00', // --interactive-primary-hover
  accent: '#3b6b12', // vert vif Wise assombri — lisible sous un glyphe blanc
  success: '#054d28', // --positive
  successBg: '#e2f6d5', // --positive-bg
  successBorder: '#9fe870', // --brand-green
  danger: '#cb272f', // --negative
  dangerBg: '#fbeaea', // --negative-bg
  dangerBorder: '#e9a6a9',
  warning: '#8a6a00', // jaune Wise assombri — lisible sous un glyphe blanc
  warningBg: '#fff7d7', // --warning-bg
  warningBorder: '#ffd11a', // --warning
  onPrimary: '#ffffff',
};

// Palette « verre » — surfaces translucides posées sur le fond dégradé.
// Le flou (expo-blur) ajoute le givré ; ces couleurs donnent la teinte et les reflets.
export const glass = {
  fill: 'rgba(255,255,255,0.55)', // remplissage carte
  fillStrong: 'rgba(255,255,255,0.72)', // carte plus opaque (lisibilité texte)
  fillSoft: 'rgba(255,255,255,0.35)', // tuiles internes
  border: 'rgba(255,255,255,0.65)', // reflet de bord clair
  borderSoft: 'rgba(255,255,255,0.4)',
  hairline: 'rgba(14,15,12,0.08)', // séparateurs discrets (--content-primary)
  tint: 'rgba(247,249,245,0.6)', // teinte des barres (header / tab bar)
};

// Dégradés du fond d'écran (le verre « réfracte » ces teintes).
export const gradients = {
  screen: ['#f1f6ec', '#f7f9f5', '#ffffff'] as const, // vert très pâle → blanc
  blobForest: 'rgba(22,51,0,0.10)', // --brand-forest
  blobLime: 'rgba(159,232,112,0.22)', // --brand-green
  blobMint: 'rgba(5,77,40,0.08)', // --positive
};

// Rayons alignés sur le web (--radius-sm/md/lg/xl).
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };

export const spacing = (n: number): number => n * 8;

// Ombre portée légère et cohérente (iOS + Android).
export function shadow(level: 1 | 2 | 3 = 1): ViewStyle {
  const map = {
    1: { e: 2, o: 0.06, r: 6, y: 2 },
    2: { e: 4, o: 0.1, r: 12, y: 4 },
    3: { e: 8, o: 0.14, r: 20, y: 8 },
  }[level];
  return Platform.select<ViewStyle>({
    android: { elevation: map.e },
    default: {
      shadowColor: '#0e0f0c',
      shadowOpacity: map.o,
      shadowRadius: map.r,
      shadowOffset: { width: 0, height: map.y },
    },
  })!;
}
