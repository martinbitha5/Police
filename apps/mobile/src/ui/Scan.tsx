import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import { ArrowRight, Barcode, CheckCircle, Info, Lock, XCircle } from 'phosphor-react-native';
import { useTheme, type StatusTone } from './theme';
import { Badge } from './Badge';
import { Surface } from './Surface';
import { Mono, Text } from './Text';

/**
 * Composites propres aux écrans de scan : check-in, bagages, embarquement,
 * dolly, chargement, restants, soute, arrivée, expédition rush.
 *
 * Tous ces écrans ont la même structure : en-tête de vol, zone de scan,
 * carte de résultat du dernier scan. Ces composants la portent une fois pour
 * toutes, sans logique métier.
 */

// ---------------------------------------------------------------------------
// ScanIndicator
// ---------------------------------------------------------------------------

export type ScanState = 'scanning' | 'success' | 'error';

export interface ScanIndicatorProps {
  state: ScanState;
  /** Diamètre du disque. L'icône fait environ 44 % de cette valeur. */
  size?: number;
  /** Change à chaque scan pour rejouer l'animation de résultat depuis le début. */
  replayKey?: string | number;
}

/**
 * Indicateur d'état du scanner, 100 % React Native (Animated + Phosphor).
 *
 *   scanning : code-barres qui pulse lentement, état d'attente
 *   success  : coche pleine qui apparaît d'un ressort, scan accepté
 *   error    : croix pleine qui apparaît d'un ressort, rejet ou alerte
 */
export function ScanIndicator({ state, size = 200, replayKey }: ScanIndicatorProps) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  // Pulsation continue tant qu'on attend un scan.
  useEffect(() => {
    if (state !== 'scanning') return;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulse]);

  // Apparition ressort à chaque nouveau résultat.
  useEffect(() => {
    if (state === 'scanning') return;
    pop.setValue(0);
    const anim = Animated.spring(pop, {
      toValue: 1,
      ...theme.spring.base,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [state, replayKey, pop, theme.spring.base]);

  const background: Record<ScanState, string> = {
    scanning: theme.colors.surfaceSunken,
    success: theme.colors.successSoft,
    error: theme.colors.dangerSoft,
  };

  const iconSize = Math.round(size * 0.44);

  const animatedStyle =
    state === 'scanning'
      ? {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
        }
      : {
          opacity: pop,
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        };

  return (
    <View
      style={[
        styles.indicator,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background[state] },
      ]}
    >
      <Animated.View style={animatedStyle}>
        {state === 'scanning' ? (
          <Barcode size={iconSize} color={theme.colors.text} />
        ) : state === 'success' ? (
          <CheckCircle size={iconSize} color={theme.colors.success} weight="fill" />
        ) : (
          <XCircle size={iconSize} color={theme.colors.danger} weight="fill" />
        )}
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// FlightHeader
// ---------------------------------------------------------------------------

export interface FlightHeaderProps {
  flightNumber: string;
  origin: string;
  destination: string;
  /** Mode de l'écran, rendu en badge neutre : « Dolly », « Restants ». Casse normale. */
  mode?: string;
  /** Emplacement de droite, typiquement un compteur. */
  right?: React.ReactNode;
  /** Ligne d'instruction sous un filet. */
  note?: string;
  style?: ViewStyle;
}

/** En-tête de vol : numéro en h1 tabulaire, route avec flèche Phosphor, mode en badge. */
export function FlightHeader({
  flightNumber,
  origin,
  destination,
  mode,
  right,
  note,
  style,
}: FlightHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[{ paddingVertical: theme.spacing.sm }, style]}>
      <View style={styles.flightRow}>
        <View style={{ flex: 1 }}>
          <View style={[styles.inlineRow, { gap: theme.spacing.sm }]}>
            <Text variant="h1" tabular numberOfLines={1}>
              {flightNumber}
            </Text>
            {mode ? <Badge label={mode} tone="neutral" /> : null}
          </View>

          <View style={[styles.inlineRow, { gap: theme.spacing.xs, marginTop: theme.spacing.xxs }]}>
            <Text variant="body" color="textSecondary" tabular>
              {origin}
            </Text>
            <ArrowRight size={theme.iconSize.xs} color={theme.colors.textSecondary} />
            <Text variant="body" color="textSecondary" tabular>
              {destination}
            </Text>
          </View>
        </View>

        {right ? <View style={{ marginLeft: theme.spacing.md }}>{right}</View> : null}
      </View>

      {note ? (
        <View
          style={[
            styles.note,
            {
              gap: theme.spacing.sm,
              marginTop: theme.spacing.md,
              paddingTop: theme.spacing.md,
              borderTopWidth: theme.borderWidth.hairline,
              borderTopColor: theme.colors.divider,
            },
          ]}
        >
          <Info size={theme.iconSize.xs} color={theme.colors.textSecondary} />
          <Text variant="bodySmall" color="textSecondary" style={{ flex: 1 }}>
            {note}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ScanStage
// ---------------------------------------------------------------------------

export interface ScanStageProps {
  state: ScanState;
  replayKey?: string | number;
  title: string;
  hint?: string;
  /** Diamètre de l'indicateur. */
  size?: number;
  style?: ViewStyle;
}

/**
 * Zone de scan : indicateur à gauche, titre et indication à droite, sur aplat
 * gris.
 *
 * Une rangée, pas un bloc centré : l'agent regarde le tapis, pas l'écran, et
 * ce qui compte ici est le résultat du dernier scan, juste dessous. La zone
 * doit se lire d'un coup d'oeil et laisser la place au reste.
 */
export function ScanStage({ state, replayKey, title, hint, size = 64, style }: ScanStageProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.stageRow,
        {
          backgroundColor: theme.colors.surfaceSunken,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.base,
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      <ScanIndicator state={state} replayKey={replayKey} size={size} />
      <View style={{ flex: 1 }}>
        <Text variant="h3" numberOfLines={2}>
          {title}
        </Text>
        {hint ? (
          <Text variant="bodySmall" color="textSecondary" numberOfLines={2} style={{ marginTop: 2 }}>
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ScanResult
// ---------------------------------------------------------------------------

export type ScanTone = StatusTone;

export interface ScanResultMeta {
  label: string;
  value: string;
}

export interface ScanResultProps {
  tone: ScanTone;
  /** Nom du passager, ou intitulé du résultat. */
  title: string;
  /** Numéro d'étiquette ou PNR, rendu en `Mono` par défaut. */
  subtitle?: string;
  /** Tuiles grises : siège, classe, bagages... */
  meta?: ScanResultMeta[];
  /** Message final, coloré du ton. */
  message?: string;
  /** Sous-titre en chasse fixe. Passer `false` pour une route ou un texte courant. */
  mono?: boolean;
  /** Libellé du badge. Par défaut, celui du ton. */
  badgeLabel?: string;
  style?: ViewStyle;
}

const TONE_LABEL: Record<ScanTone, string> = {
  success: 'Accepté',
  danger: 'Refusé',
  warning: 'Attention',
  info: 'Information',
  neutral: 'Enregistré',
};

/**
 * Carte du dernier scan : filet gauche de 4 pt de la couleur du ton, badge en
 * haut à droite, titre, sous-titre en chasse fixe, tuiles méta, message.
 */
export function ScanResult({
  tone,
  title,
  subtitle,
  meta,
  message,
  mono = true,
  badgeLabel,
  style,
}: ScanResultProps) {
  const theme = useTheme();

  const railColor: Record<ScanTone, string> = {
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
    neutral: theme.colors.primary,
  };

  const messageColor: Record<ScanTone, 'success' | 'warning' | 'danger' | 'info' | 'text'> = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
    neutral: 'text',
  };

  return (
    <Surface
      elevation={0}
      bordered
      radius="md"
      accessibilityLiveRegion="polite"
      style={[styles.result, { borderLeftWidth: 4, borderLeftColor: railColor[tone] }, style]}
    >
      <View style={[styles.resultBody, { padding: theme.spacing.base }]}>
        <View style={[styles.resultTop, { gap: theme.spacing.md }]}>
          <Text variant="h2" style={{ flex: 1 }} numberOfLines={2}>
            {title}
          </Text>
          <Badge label={badgeLabel ?? TONE_LABEL[tone]} tone={tone} />
        </View>

        {subtitle ? (
          mono ? (
            <Mono color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
              {subtitle}
            </Mono>
          ) : (
            <Text variant="bodyStrong" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
              {subtitle}
            </Text>
          )
        ) : null}

        {meta && meta.length > 0 ? (
          <View style={[styles.metaRow, { gap: theme.spacing.sm, marginTop: theme.spacing.md }]}>
            {meta.map((item) => (
              <View
                key={item.label}
                style={[
                  styles.metaTile,
                  {
                    backgroundColor: theme.colors.surfaceSunken,
                    borderRadius: theme.radius.sm,
                    paddingVertical: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.md,
                  },
                ]}
              >
                <Text variant="caption" color="textSecondary" numberOfLines={1}>
                  {item.label}
                </Text>
                <Text variant="bodyStrong" tabular numberOfLines={1}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {message ? (
          <Text variant="label" color={messageColor[tone]} style={{ marginTop: theme.spacing.md }}>
            {message}
          </Text>
        ) : null}
      </View>
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// LockedStage
// ---------------------------------------------------------------------------

export interface LockedStageProps {
  title: string;
  reason: string;
  style?: ViewStyle;
}

/** Zone de scan verrouillée : porte fermée, vol annulé. Même gabarit que `ScanStage`. */
export function LockedStage({ title, reason, style }: LockedStageProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.stageRow,
        {
          backgroundColor: theme.colors.surfaceSunken,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.base,
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.lockDisc,
          { backgroundColor: theme.colors.dangerSoft, borderRadius: theme.radius.pill },
        ]}
      >
        <Lock size={theme.iconSize.lg} color={theme.colors.danger} weight="fill" />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="h3" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="bodySmall" color="textSecondary" style={{ marginTop: 2 }}>
          {reason}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: { alignItems: 'center', justifyContent: 'center' },
  flightRow: { flexDirection: 'row', alignItems: 'center' },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  note: { flexDirection: 'row', alignItems: 'flex-start' },
  stageRow: { flexDirection: 'row', alignItems: 'center' },
  lockDisc: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  result: { overflow: 'hidden' },
  resultBody: {},
  resultTop: { flexDirection: 'row', alignItems: 'flex-start' },
  metaRow: { flexDirection: 'row' },
  metaTile: { flex: 1 },
});
