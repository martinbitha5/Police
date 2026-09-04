import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from './theme';
import { Pressable } from './Pressable';
import { Text } from './Text';

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export interface AvatarProps {
  /** Initiales affichées (deux lettres au plus). Aucune photo dans cette app. */
  initials?: string;
  /** Alias de `initials`, pour le code porté depuis marketplace. */
  fallback?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ initials, fallback, size = 44, style }: AvatarProps) {
  const theme = useTheme();
  const label = (initials ?? fallback ?? '').slice(0, 2).toUpperCase();

  return (
    <View
      accessibilityLabel={label}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Text variant="labelStrong" style={{ color: theme.colors.onPrimarySoft, fontSize: size * 0.36 }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ligne de liste
// ---------------------------------------------------------------------------

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  style?: ViewStyle;
}

/**
 * Ligne de réglage ou d'information.
 *
 * Icône posée nue, sans pastille : une pastille grise transformerait chaque
 * ligne en carte et un menu de dix entrées en empilement de dix blocs.
 */
export function ListRow({
  title,
  subtitle,
  icon,
  right,
  onPress,
  destructive = false,
  style,
}: ListRowProps) {
  const theme = useTheme();

  const content = (
    <View style={[styles.row, { paddingVertical: theme.spacing.base }, style]}>
      {icon ? <View style={{ width: 32, marginRight: theme.spacing.md }}>{icon}</View> : null}

      <View style={{ flex: 1 }}>
        <Text variant="body" color={destructive ? 'danger' : 'text'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary" numberOfLines={2} style={{ marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={{ marginLeft: theme.spacing.sm }}>{right}</View> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} noScale accessibilityLabel={title} style={{ minHeight: 44 }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
