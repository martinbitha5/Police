import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { FlightOperation, FlightStatus } from '@police/shared';
import { operationAllowed, stationRole, stationRoleSummary } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { colors, radius, spacing } from '@/theme';

const STATUS_LABEL: Record<FlightStatus, string> = {
  scheduled: 'Programmé',
  boarding: 'Embarquement',
  closed: 'Porte fermée',
  cancelled: 'Annulé',
};
const STATUS_COLOR: Record<FlightStatus, string> = {
  scheduled: colors.muted,
  boarding: colors.success,
  closed: colors.danger,
  cancelled: colors.warning,
};

function formatTime(ts: string | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Opérations d'un vol, dans l'ordre du terrain.
 *
 * Toutes ne sont pas proposées partout : l'agent de l'aéroport de départ
 * prépare et charge, celui de l'aéroport d'arrivée réceptionne, celui d'une
 * escale fait les deux. On masque plutôt que de griser, parce qu'une option
 * grisée reste une option qu'on essaie d'ouvrir. L'API refuse de toute façon,
 * un PDA resté en version antérieure ne peut donc rien enregistrer de travers.
 */
const OPERATIONS: {
  op: FlightOperation;
  path:
    | '/checkin'
    | '/baggage'
    | '/embarquement'
    | '/dolly'
    | '/charger'
    | '/rush'
    | '/expedition-rush'
    | '/soute'
    | '/arrivee';
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  subtitle: string;
  /** Verrouillé quand la porte est fermée ou le vol annulé. */
  lockOnClosed?: boolean;
}[] = [
  {
    op: 'checkin',
    path: '/checkin',
    icon: 'qr-code',
    tint: colors.primary,
    title: 'Check-in',
    subtitle: 'Scanner les boarding pass',
    lockOnClosed: true,
  },
  {
    op: 'baggage',
    path: '/baggage',
    icon: 'bag-handle',
    tint: colors.warning,
    title: 'Bagages',
    subtitle: 'Scanner les étiquettes bagage',
  },
  {
    op: 'expedition_rush',
    path: '/expedition-rush',
    icon: 'send',
    tint: colors.primary,
    title: 'Expédition rush',
    subtitle: 'Bagages voyageant sans passager',
  },
  {
    op: 'embarquement',
    path: '/embarquement',
    icon: 'airplane',
    tint: colors.success,
    title: 'Embarquement',
    subtitle: 'Confirmer les passagers à la porte',
    lockOnClosed: true,
  },
  {
    op: 'dolly',
    path: '/dolly',
    icon: 'cart',
    tint: colors.primary,
    title: 'Dolly',
    subtitle: 'Contrôle rayon X — bagages sûrs vers le chargement',
  },
  {
    op: 'charger',
    path: '/charger',
    icon: 'cube',
    tint: colors.accent,
    title: 'Charger',
    subtitle: 'Bagages chargés en soute pour la destination',
  },
  {
    op: 'rush',
    path: '/rush',
    icon: 'repeat',
    tint: colors.warning,
    title: 'Restants',
    subtitle: 'Bagages de ce vol restés au sol, à réacheminer',
  },
  {
    op: 'soute',
    path: '/soute',
    icon: 'layers',
    tint: colors.accent,
    title: 'Soute',
    subtitle: 'Identifier le compartiment de chargement',
  },
  {
    op: 'arrivee',
    path: '/arrivee',
    icon: 'download',
    tint: colors.success,
    title: 'Arrivée',
    subtitle: 'Réceptionner les bagages à destination',
  },
];

export default function FlightDetail() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { getFlight, statsFor, loading, refreshStatsFor } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;

  // À l'ouverture du vol, on redemande SES compteurs à la base : l'écran doit
  // afficher les vrais chiffres même si le chargement groupé du login a
  // échoué sur ce réseau ou si le temps réel est resté muet.
  useEffect(() => {
    if (flightId) void refreshStatsFor(flightId);
  }, [flightId, refreshStatsFor]);
  const { pax, bagTotal, bagOk, boarded } = flightId
    ? statsFor(flightId)
    : { pax: 0, bagTotal: 0, bagOk: 0, boarded: 0 };
  const pad = useSafePadding();
  const isLocked = flight?.status === 'closed' || flight?.status === 'cancelled';
  const lockReason = flight?.status === 'cancelled' ? 'Vol annulé' : 'Porte fermée';

  if (loading && !flight) {
    return (
      <View style={styles.center}>
        <ScreenBackground />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!flight) {
    return (
      <View style={styles.center}>
        <ScreenBackground />
        <Text style={styles.muted}>Vol introuvable</Text>
      </View>
    );
  }

  // Ce que l'agent peut faire dépend de la place de SON aéroport sur CE vol,
  // pas de son compte : le même agent prépare le départ de son vol du matin et
  // réceptionne l'avion qui rentre l'après-midi.
  const role = stationRole(flight, profile?.airport_code);
  const available = OPERATIONS.filter((o) => operationAllowed(o.op, role));
  const summary = stationRoleSummary(role, flight);

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: pad.paddingTop, paddingBottom: pad.paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
      {/* Carte vol */}
      <GlassCard strong rounded={radius.xl} contentStyle={styles.flightCard}>
        <View style={styles.flightTop}>
          <Text style={styles.flightNumber}>{flight.flight_number}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[flight.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLOR[flight.status] }]}>
              {STATUS_LABEL[flight.status]}
            </Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <Text style={styles.routeCode}>{flight.origin}</Text>
            <Text style={styles.routeTime}>{formatTime(flight.departure_time)}</Text>
          </View>
          <View style={styles.routeLine}>
            <View style={styles.routeDash} />
            <Ionicons name="airplane" size={20} color={colors.primary} />
            <View style={styles.routeDash} />
          </View>
          <View style={styles.routePoint}>
            <Text style={styles.routeCode}>{flight.destination}</Text>
            <Text style={styles.routeTime}>{formatTime(flight.arrival_time)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat icon="people" label="Passagers" value={String(pax)} />
          <View style={styles.statDivider} />
          <Stat icon="bag-handle" label="Bagages" value={`${bagOk}/${bagTotal}`} />
          <View style={styles.statDivider} />
          <Stat icon="airplane" label="Embarqués" value={`${boarded}/${pax}`} />
        </View>
      </GlassCard>

      <View>
        <Text style={styles.sectionTitle}>Que voulez-vous faire ?</Text>
        {summary ? <Text style={styles.sectionNote}>{summary}</Text> : null}
      </View>

      {available.map((o) => (
        <OptionCard
          key={o.op}
          icon={o.icon}
          tint={o.tint}
          title={o.title}
          subtitle={o.subtitle}
          lockedReason={o.lockOnClosed && isLocked ? lockReason : undefined}
          onPress={() => router.push({ pathname: o.path, params: { flightId: flight.id } })}
        />
      ))}
      </ScrollView>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OptionCard({
  icon,
  tint,
  title,
  subtitle,
  onPress,
  lockedReason,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  lockedReason?: string;
}) {
  const locked = !!lockedReason;
  return (
    <Pressable
      style={({ pressed }) => [{ opacity: locked ? 0.45 : pressed ? 0.7 : 1 }]}
      onPress={locked ? undefined : onPress}
      disabled={locked}
    >
      <GlassCard contentStyle={styles.option}>
        <View style={[styles.optionIcon, { backgroundColor: locked ? colors.muted : tint }]}>
          <Ionicons name={locked ? 'lock-closed' : icon} size={28} color={colors.onPrimary} />
        </View>
        <View style={styles.optionTexts}>
          <Text style={[styles.optionTitle, locked && { color: colors.muted }]}>{title}</Text>
          <Text style={styles.optionSubtitle}>{locked ? lockedReason : subtitle}</Text>
        </View>
        {locked ? (
          <Ionicons name="lock-closed" size={18} color={colors.muted} />
        ) : (
          <Ionicons name="chevron-forward" size={24} color={colors.muted} />
        )}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing(2), gap: spacing(2) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.muted, fontSize: 16 },
  flightCard: { padding: spacing(2.5) },
  flightTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flightNumber: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.75),
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing(1.25),
    paddingVertical: spacing(0.5),
    borderRadius: radius.pill,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing(2.5) },
  routePoint: { alignItems: 'center', width: 76 },
  routeCode: { color: colors.text, fontSize: 24, fontWeight: '800' },
  routeTime: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 2 },
  routeLine: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing(0.5) },
  routeDash: { flex: 1, height: 2, backgroundColor: colors.border, borderRadius: 1 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(2.5),
    paddingTop: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: spacing(0.5), marginLeft: spacing(0.5) },
  sectionNote: { color: colors.muted, fontSize: 14, fontWeight: '600', marginTop: 2, marginLeft: spacing(0.5) },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(2),
    gap: spacing(2),
  },
  optionPressed: { opacity: 0.7 },
  optionIcon: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  optionTexts: { flex: 1 },
  optionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  optionSubtitle: { color: colors.muted, fontSize: 14, marginTop: 2, fontWeight: '600' },
});
