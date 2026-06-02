import { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, glass, gradients, radius, shadow, spacing } from './theme';

const TAB_BAR_HEIGHT = 64;

/**
 * Marges de contenu pour un écran SANS en-tête fixe : le contenu (titre inclus)
 * défile librement, décalé sous la barre d'état. `tabBar` ajoute l'espace de la
 * tab bar flottante en bas. À appliquer au `contentContainerStyle` d'un
 * ScrollView/FlatList ou au padding d'une View.
 */
export function useContentPadding(tabBar = false): { paddingTop: number; paddingBottom: number } {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + spacing(1.5),
    paddingBottom: (tabBar ? TAB_BAR_HEIGHT + insets.bottom : insets.bottom) + spacing(2),
  };
}

/** Alias sans tab bar — écrans de travail (vol, check-in, bagages). */
export function useSafePadding(): { paddingTop: number; paddingBottom: number } {
  return useContentPadding(false);
}

/**
 * Fond d'écran dégradé + halos colorés flous.
 * À placer en premier enfant d'un écran ; le verre posé dessus « réfracte » ces teintes.
 */
export function ScreenBackground({ children }: { children?: ReactNode }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={gradients.screen}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Halos doux pour donner de la profondeur au givré */}
      <View style={[styles.blob, styles.blobTop, { backgroundColor: gradients.blobBlue }]} />
      <View style={[styles.blob, styles.blobRight, { backgroundColor: gradients.blobSky }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: gradients.blobViolet }]} />
      {children}
    </View>
  );
}

/**
 * Carte en verre dépoli : flou réel (expo-blur) + remplissage translucide + reflet de bord.
 * `intensity` ~ force du givré ; `strong` augmente l'opacité pour le texte dense.
 */
export function GlassCard({
  children,
  style,
  contentStyle,
  intensity = 28,
  strong = false,
  rounded = radius.lg,
  elevated = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  strong?: boolean;
  rounded?: number;
  elevated?: boolean;
}) {
  return (
    <View style={[{ borderRadius: rounded }, elevated && shadow(2), styles.clip, style]}>
      <BlurView
        intensity={intensity}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={[styles.fill, { borderRadius: rounded }]}
      >
        <View
          style={[
            styles.glassLayer,
            { borderRadius: rounded, backgroundColor: strong ? glass.fillStrong : glass.fill },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </BlurView>
    </View>
  );
}

/** Barre en verre (header / tab bar) : flou translucide plein cadre. */
export function GlassBar({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <BlurView
      intensity={40}
      tint="light"
      experimentalBlurMethod="dimezisBlurView"
      style={[StyleSheet.absoluteFill, styles.bar, style]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  fill: { overflow: 'hidden' },
  glassLayer: {
    borderWidth: 1,
    borderColor: glass.border,
  },
  bar: {
    backgroundColor: glass.tint,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: glass.border,
  },
  blob: { position: 'absolute', borderRadius: 999 },
  blobTop: { width: 320, height: 320, top: -120, left: -90 },
  blobRight: { width: 300, height: 300, top: 120, right: -130 },
  blobBottom: { width: 360, height: 360, bottom: -150, left: -60 },
});

export { colors };
