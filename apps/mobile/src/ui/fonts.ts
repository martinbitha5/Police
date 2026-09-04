import {
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

/**
 * Les huit graisses utilisées par `fontFamily` (theme.ts), prêtes à passer à
 * `useFonts` de expo-font dans le layout racine :
 *
 *   const [fontsLoaded] = useFonts(FONT_ASSETS);
 *
 * Les clés sont exactement les noms de famille référencés par les tokens.
 */
export const FONT_ASSETS = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} as const;
