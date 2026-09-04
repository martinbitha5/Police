import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from './theme';
import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface GaugeProps {
  /** Valeur mise en avant au centre. */
  value: number;
  /** Référence dont `value` est une part. 0 laisse l'anneau vide. */
  total: number;
  /** Ce que compte la jauge : « Vols », « Passagers ». */
  label: string;
  /** Diamètre de l'anneau. */
  size?: number;
  /** Épaisseur du trait. */
  stroke?: number;
  style?: ViewStyle;
}

/**
 * Jauge circulaire : un anneau gris, et par-dessus l'arc de la part accomplie.
 *
 * Une seule couleur, l'accent, comme le veut le registre : la couleur signale
 * une part, elle ne décore pas. Le chiffre est au centre, en chiffres
 * tabulaires pour ne pas bouger quand il change, et la référence est dite en
 * toutes lettres dessous, parce qu'un arc seul ne dit pas de quoi il est la
 * part.
 */
export function Gauge({ value, total, label, size = 96, stroke = 8, style }: GaugeProps) {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;

  useEffect(() => {
    // Pilote JS obligatoire : les propriétés SVG ne passent pas par le natif.
    Animated.timing(progress, {
      toValue: ratio,
      duration: theme.duration.slow,
      useNativeDriver: false,
    }).start();
  }, [ratio, progress, theme.duration.slow]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const percent = Math.round(ratio * 100);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label} : ${value} sur ${total}`}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.wrap, style]}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.divider}
            strokeWidth={stroke}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            // Départ à midi, sens horaire.
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text variant="priceLarge" tabular numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>

      <Text variant="label" align="center" style={{ marginTop: theme.spacing.sm }}>
        {label}
      </Text>
      <Text variant="caption" color="textSecondary" align="center" tabular>
        {total > 0 ? `sur ${total}` : 'aucun'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
