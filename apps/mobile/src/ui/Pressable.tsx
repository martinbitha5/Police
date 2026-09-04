import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable as RNPressable,
  type PressableProps as RNPressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export interface PressableProps extends Omit<RNPressableProps, 'style'> {
  /** StyleProp : accepte les tableaux avec conditions (`cond && style`). */
  style?: StyleProp<ViewStyle>;
  /** Désactive l'échelle de pression (barres pleine largeur, lignes de liste). */
  noScale?: boolean;
  /** Opacité au lieu de l'échelle, pour les éléments déjà animés par ailleurs. */
  fade?: boolean;
  children?: React.ReactNode;
}

/**
 * Élément pressable de l'application.
 *
 * Le retour tactile passe par `scale`, jamais par une translation : déplacer
 * un élément décale ses voisins. Animé avec l'API `Animated` de React Native
 * sur le pilote natif, sans dépendance supplémentaire.
 */
export function Pressable({
  style,
  noScale = false,
  fade = false,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback<NonNullable<RNPressableProps['onPressIn']>>(
    (event) => {
      if (!noScale) {
        Animated.spring(scale, {
          toValue: theme.pressScale,
          ...theme.spring.snappy,
          useNativeDriver: true,
        }).start();
      }
      if (fade) {
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: theme.duration.instant,
          useNativeDriver: true,
        }).start();
      }
      onPressIn?.(event);
    },
    [fade, noScale, onPressIn, opacity, scale, theme],
  );

  const handlePressOut = useCallback<NonNullable<RNPressableProps['onPressOut']>>(
    (event) => {
      Animated.spring(scale, { toValue: 1, ...theme.spring.snappy, useNativeDriver: true }).start();
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.duration.fast,
        useNativeDriver: true,
      }).start();
      onPressOut?.(event);
    },
    [onPressOut, opacity, scale, theme],
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { transform: [{ scale }], opacity: disabled ? 0.45 : opacity }]}
      // Android : ondulation discrète sur les lignes sans échelle.
      android_ripple={
        noScale ? { color: theme.colors.primarySoft, borderless: false } : undefined
      }
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
