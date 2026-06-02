import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';

// Indicateur de scan 100 % natif React Native (Animated + Ionicons).
// Remplace lottie-react-native, qui provoquait un écran blanc sur certains
// PDA Android (rendu natif Lottie instable selon l'appareil/GPU). Aucune
// dépendance native lourde : fiable sur tous les terminaux Zebra.
//   scanning : icône scan qui pulse en boucle → état d'attente
//   success  : coche verte qui apparaît (ressort) → scan accepté
//   error    : croix rouge qui apparaît → rejet / alerte fraude
const CONFIG = {
  scanning: { icon: 'scan-outline', color: colors.primary, bg: colors.surfaceAlt },
  success: { icon: 'checkmark-circle', color: colors.success, bg: colors.successBg },
  error: { icon: 'close-circle', color: colors.danger, bg: colors.dangerBg },
} as const;

export type ScanState = keyof typeof CONFIG;

interface Props {
  state: ScanState;
  size?: number;
  /** Change à chaque scan pour rejouer l'animation de résultat depuis le début. */
  replayKey?: string | number;
}

export function ScanLottie({ state, size = 200, replayKey }: Props): React.JSX.Element {
  const pulse = useRef(new Animated.Value(0)).current; // boucle pendant l'attente
  const pop = useRef(new Animated.Value(0)).current; // entrée du résultat

  // Pulsation continue tant qu'on attend un scan.
  useEffect(() => {
    if (state !== 'scanning') return;
    pulse.setValue(0);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [state, pulse]);

  // Apparition « ressort » à chaque nouveau résultat (succès/erreur).
  useEffect(() => {
    if (state === 'scanning') return;
    pop.setValue(0);
    const anim = Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [state, replayKey, pop]);

  const cfg = CONFIG[state];
  const iconSize = Math.round(size * 0.5);

  const animatedStyle =
    state === 'scanning'
      ? {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
        }
      : {
          opacity: pop,
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        };

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[styles.halo, { width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39, backgroundColor: cfg.bg }]}
      />
      <Animated.View style={animatedStyle}>
        <Ionicons name={cfg.icon} size={iconSize} color={cfg.color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute' },
});
