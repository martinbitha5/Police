import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  CloudSlash,
  Info,
  MagnifyingGlass,
  Warning,
  WarningOctagon,
} from 'phosphor-react-native';
import { useTheme } from './theme';
import { Button } from './Button';
import { Pressable } from './Pressable';
import { Text } from './Text';

/**
 * Les six états obligatoires : loading, empty, error, success, offline,
 * no-results. Un écran de données qui n'implémente pas au moins
 * loading / empty / error est incomplet.
 */

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/** Bloc gris qui respire, à sa place dans la page. Jamais un voile plein écran. */
export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps) {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.skeletonHighlight,
          opacity: progress,
        },
        style,
      ]}
    />
  );
}

/** Squelette d'une ligne de liste : pastille + deux lignes de texte. */
export function RowSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.rowSkeleton, { paddingVertical: theme.spacing.base, gap: theme.spacing.md }]}>
      <Skeleton width={40} height={40} radius={20} />
      <View style={{ flex: 1, gap: theme.spacing.sm }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="35%" height={12} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, index) => (
        <RowSkeleton key={index} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// États vides / erreur
// ---------------------------------------------------------------------------

export interface StateViewProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

function StateView({ title, description, actionLabel, onAction, icon, style }: StateViewProps) {
  const theme = useTheme();

  return (
    <View style={[styles.state, { padding: theme.spacing['2xl'] }, style]}>
      {/* Icône nue, sans pastille : le message est tout ce qui compte ici. */}
      {icon ? <View style={{ marginBottom: theme.spacing.lg }}>{icon}</View> : null}

      <Text variant="h2" align="center">
        {title}
      </Text>

      {description ? (
        <Text
          variant="body"
          color="textSecondary"
          align="center"
          style={{ marginTop: theme.spacing.sm, maxWidth: 300 }}
        >
          {description}
        </Text>
      ) : null}

      {/* Pilule noire : seule action de l'écran, rien ne justifie de la sous-pondérer. */}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          style={{ marginTop: theme.spacing.xl }}
        />
      ) : null}
    </View>
  );
}

/** État vide : décrit un fait, pas une émotion. « Aucun vol aujourd'hui. » */
export function EmptyState(props: StateViewProps) {
  return <StateView {...props} />;
}

export function ErrorState({
  title = 'Impossible de charger',
  description = 'Vérifiez votre connexion et réessayez.',
  onRetry,
  ...rest
}: Partial<StateViewProps> & { onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <StateView
      title={title}
      description={description}
      actionLabel={onRetry ? 'Réessayer' : undefined}
      onAction={onRetry}
      icon={<WarningOctagon size={48} color={theme.colors.danger} weight="duotone" />}
      {...rest}
    />
  );
}

export function NoResultsState({ query, onReset }: { query: string; onReset?: () => void }) {
  const theme = useTheme();
  return (
    <StateView
      title="Aucun résultat"
      description={`Rien ne correspond à « ${query} ». Essayez un autre mot ou réinitialisez les filtres.`}
      actionLabel={onReset ? 'Réinitialiser' : undefined}
      onAction={onReset}
      icon={<MagnifyingGlass size={48} color={theme.colors.textMuted} weight="duotone" />}
    />
  );
}

// ---------------------------------------------------------------------------
// Hors ligne
// ---------------------------------------------------------------------------

/**
 * Bandeau hors ligne persistant.
 *
 * Persistant, pas un toast : tant que la connexion est absente, l'agent doit
 * pouvoir comprendre à tout moment pourquoi ses scans échouent.
 *
 * `safeAreaTop` : à activer quand le bandeau est rendu en haut de la fenêtre,
 * hors de tout SafeAreaView.
 */
export function OfflineBanner({
  visible,
  onRetry,
  safeAreaTop = false,
}: {
  visible: boolean;
  onRetry?: () => void;
  safeAreaTop?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: theme.duration.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [visible, progress, theme.duration.base]);

  if (!visible) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.warningSoft,
          paddingTop: (safeAreaTop ? insets.top : 0) + theme.spacing.md,
          paddingBottom: theme.spacing.md,
          paddingHorizontal: theme.screenPadding,
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
          ],
        },
      ]}
    >
      <CloudSlash size={theme.iconSize.sm} color={theme.colors.onWarningSoft} weight="fill" />
      <Text variant="label" color="onWarningSoft" style={{ flex: 1, marginLeft: theme.spacing.sm }}>
        Vous êtes hors ligne. Les scans sont indisponibles.
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          hitSlop={theme.spacing.md}
          accessibilityLabel="Réessayer la connexion"
        >
          <Text variant="labelStrong" color="onWarningSoft">
            Réessayer
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Alerte en ligne
// ---------------------------------------------------------------------------

export type InlineAlertTone = 'info' | 'warning' | 'danger' | 'success';

export interface InlineAlertProps {
  message: string;
  tone?: InlineAlertTone;
  /** Action secondaire alignée à droite : « Réessayer », « Voir »... */
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

/**
 * Bandeau d'information contextuel : erreur de formulaire, avertissement
 * métier (« Mauvais vol », « Porte fermée »).
 */
export function InlineAlert({ message, tone = 'info', actionLabel, onAction, style }: InlineAlertProps) {
  const theme = useTheme();

  const palettes: Record<InlineAlertTone, { bg: string; fg: string; icon: React.ReactNode }> = {
    info: {
      bg: theme.colors.infoSoft,
      fg: theme.colors.onInfoSoft,
      icon: <Info size={theme.iconSize.sm} color={theme.colors.onInfoSoft} weight="fill" />,
    },
    warning: {
      bg: theme.colors.warningSoft,
      fg: theme.colors.onWarningSoft,
      icon: <Warning size={theme.iconSize.sm} color={theme.colors.onWarningSoft} weight="fill" />,
    },
    danger: {
      bg: theme.colors.dangerSoft,
      fg: theme.colors.onDangerSoft,
      icon: (
        <WarningOctagon size={theme.iconSize.sm} color={theme.colors.onDangerSoft} weight="fill" />
      ),
    },
    success: {
      bg: theme.colors.successSoft,
      fg: theme.colors.onSuccessSoft,
      icon: (
        <CheckCircle size={theme.iconSize.sm} color={theme.colors.onSuccessSoft} weight="fill" />
      ),
    },
  };

  const palette = palettes[tone];

  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[
        styles.alert,
        {
          backgroundColor: palette.bg,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        },
        style,
      ]}
    >
      {palette.icon}
      <Text variant="label" style={{ color: palette.fg, flex: 1 }}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={theme.spacing.md} accessibilityRole="button">
          <Text variant="labelStrong" style={{ color: palette.fg, textDecorationLine: 'underline' }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  rowSkeleton: { flexDirection: 'row', alignItems: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center' },
  alert: { flexDirection: 'row', alignItems: 'center' },
});
