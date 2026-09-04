import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

export type IconBubbleTone =
  | 'neutral'
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface IconBubbleProps {
  /** Diamètre du cercle. L'icône à l'intérieur devrait faire environ 44 % de cette valeur. */
  size?: number;
  tone?: IconBubbleTone;
  children: React.ReactNode;
  style?: ViewStyle;
}

/** Icône dans un rond de couleur douce. */
export function IconBubble({ size = 72, tone = 'neutral', children, style }: IconBubbleProps) {
  const theme = useTheme();

  const backgrounds: Record<IconBubbleTone, string> = {
    neutral: theme.colors.surfaceSunken,
    primary: theme.colors.primarySoft,
    accent: theme.colors.accentSoft,
    success: theme.colors.successSoft,
    warning: theme.colors.warningSoft,
    danger: theme.colors.dangerSoft,
    info: theme.colors.infoSoft,
  };

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgrounds[tone],
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
