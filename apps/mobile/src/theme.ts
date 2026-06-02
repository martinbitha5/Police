import { Platform, type ViewStyle } from 'react-native';

// Thème CLAIR — aéroport, propre et lisible en plein jour sur un PDA Zebra.
// Fonds blancs/ardoise très clairs, accent bleu aviation + teintes d'état douces.
export const colors = {
  bg: '#eef2f7', // ardoise très clair (fond d'écran)
  surface: '#ffffff', // cartes
  surfaceAlt: '#f8fafc', // zones internes douces
  border: '#e2e8f0', // slate-200
  text: '#0f172a', // slate-900
  muted: '#64748b', // slate-500
  primary: '#2563eb', // blue-600
  primaryDark: '#1d4ed8',
  accent: '#0ea5e9', // sky-500
  success: '#16a34a',
  successBg: '#dcfce7',
  successBorder: '#86efac',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerBorder: '#fca5a5',
  warning: '#d97706',
  warningBg: '#fef3c7',
  warningBorder: '#fcd34d',
  onPrimary: '#ffffff',
};

// Palette « verre » — surfaces translucides posées sur un fond dégradé.
// Le flou (expo-blur) ajoute le givré ; ces couleurs donnent la teinte et les reflets.
export const glass = {
  fill: 'rgba(255,255,255,0.55)', // remplissage carte
  fillStrong: 'rgba(255,255,255,0.72)', // carte plus opaque (lisibilité texte)
  fillSoft: 'rgba(255,255,255,0.35)', // tuiles internes
  border: 'rgba(255,255,255,0.65)', // reflet de bord clair
  borderSoft: 'rgba(255,255,255,0.4)',
  hairline: 'rgba(15,23,42,0.06)', // séparateurs discrets
  tint: 'rgba(247,250,255,0.6)', // teinte des barres (header / tab bar)
};

// Dégradés du fond d'écran (le verre « réfracte » ces teintes).
export const gradients = {
  screen: ['#eaf1fb', '#eef2f7', '#f4eefb'] as const, // bleu ciel → ardoise → mauve
  blobBlue: 'rgba(37,99,235,0.18)',
  blobSky: 'rgba(14,165,233,0.16)',
  blobViolet: 'rgba(139,92,246,0.14)',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

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
      shadowColor: '#0f172a',
      shadowOpacity: map.o,
      shadowRadius: map.r,
      shadowOffset: { width: 0, height: map.y },
    },
  })!;
}
