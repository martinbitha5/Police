import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { FlightStatus } from '@police/shared';
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

export default function FlightDetail() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const router = useRouter();
  const { getFlight, statsFor, loading } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
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

      <Text style={styles.sectionTitle}>Que voulez-vous faire ?</Text>

      <OptionCard
        icon="qr-code"
        tint={colors.primary}
        title="Check-in"
        subtitle="Scanner les boarding pass"
        lockedReason={isLocked ? lockReason : undefined}
        onPress={() => router.push({ pathname: '/checkin', params: { flightId: flight.id } })}
      />
      <OptionCard
        icon="bag-handle"
        tint={colors.warning}
        title="Bagages"
        subtitle="Scanner les étiquettes bagage"
        onPress={() => router.push({ pathname: '/baggage', params: { flightId: flight.id } })}
      />
      <OptionCard
        icon="airplane"
        tint={colors.success}
        title="Embarquement"
        subtitle="Confirmer les passagers à la porte"
        lockedReason={isLocked ? lockReason : undefined}
        onPress={() => router.push({ pathname: '/embarquement', params: { flightId: flight.id } })}
      />
      <OptionCard
        icon="cube"
        tint={colors.accent}
        title="Charger"
        subtitle="Bagages chargés en soute pour la destination"
        onPress={() => router.push({ pathname: '/charger', params: { flightId: flight.id } })}
      />
      <OptionCard
        icon="repeat"
        tint={colors.warning}
        title="Rush"
        subtitle="Bagages restants à réacheminer"
        onPress={() => router.push({ pathname: '/rush', params: { flightId: flight.id } })}
      />
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
