import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { FlightStatus } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { ScreenBackground, GlassCard, useContentPadding } from '@/Glass';
import { colors, radius, spacing } from '@/theme';

function firstName(full: string | null | undefined): string {
  if (!full) return 'Agent';
  const parts = full.trim().split(/\s+/);
  // Format BCBP « NOM Prenom » → on prend le dernier mot comme prénom usuel.
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

function todayLabel(): string {
  const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function RecapItem({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: number | string; label: string }) {
  return (
    <View style={styles.recapItem}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.recapValue}>{value}</Text>
      <Text style={styles.recapLabel}>{label}</Text>
    </View>
  );
}

const STATUS_LABEL: Record<FlightStatus, string> = {
  scheduled: 'Programmé',
  boarding: 'Embarquement',
  closed: 'Fermé',
  cancelled: 'Annulé',
};

const STATUS_COLOR: Record<FlightStatus, string> = {
  scheduled: colors.muted,
  boarding: colors.success,
  closed: colors.danger,
  cancelled: colors.warning,
};

const STATUS_BG: Record<FlightStatus, string> = {
  scheduled: colors.surfaceAlt,
  boarding: colors.successBg,
  closed: colors.dangerBg,
  cancelled: colors.warningBg,
};

function formatTime(ts: string | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function Flights() {
  const router = useRouter();
  const { profile } = useAuth();
  const { flights, loading, refresh, statsFor } = useFlights();
  const [refreshing, setRefreshing] = useState(false);
  const pad = useContentPadding(true);

  // Récap du jour : somme des stats déjà en cache (pas de requête supplémentaire).
  const totals = useMemo(() => {
    return flights.reduce(
      (acc, f) => {
        const s = statsFor(f.id);
        acc.pax += s.pax;
        acc.bagTotal += s.bagTotal;
        acc.bagOk += s.bagOk;
        return acc;
      },
      { pax: 0, bagTotal: 0, bagOk: 0 },
    );
  }, [flights, statsFor]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ScreenBackground />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Spec : le mobile est réservé aux agents terrain.
  if (profile && profile.role !== 'agent') {
    return (
      <View style={styles.center}>
        <ScreenBackground />
        <Ionicons name="lock-closed" size={48} color={colors.muted} />
        <Text style={styles.blockTitle}>Accès réservé aux agents</Text>
        <Text style={styles.blockText}>
          Le scan terrain est réservé aux comptes agent. Les superviseurs et administrateurs utilisent le dashboard web.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <FlatList
        data={flights}
        keyExtractor={(f) => f.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            {/* 1. Bandeau d'accueil */}
            <Text style={styles.greeting}>Bonjour, {firstName(profile?.full_name)}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaDate}>{todayLabel()}</Text>
              {profile?.gate ? (
                <View style={styles.gateChip}>
                  <Ionicons name="location" size={12} color={colors.primary} />
                  <Text style={styles.gateChipText}>{profile.gate}</Text>
                </View>
              ) : null}
            </View>

            {/* 2. Récap du jour */}
            <GlassCard strong rounded={radius.xl} contentStyle={styles.recap}>
              <RecapItem icon="airplane" value={flights.length} label="Vols" />
              <View style={styles.recapDivider} />
              <RecapItem icon="people" value={totals.pax} label="Passagers" />
              <View style={styles.recapDivider} />
              <RecapItem icon="bag-handle" value={`${totals.bagOk}/${totals.bagTotal}`} label="Bagages" />
            </GlassCard>

            <Text style={styles.intro}>Sélectionnez un vol pour commencer</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Aucun vol aujourd'hui</Text>}
        contentContainerStyle={{ paddingHorizontal: spacing(2), paddingTop: pad.paddingTop, paddingBottom: pad.paddingBottom }}
        renderItem={({ item }) => {
          const s = statsFor(item.id);
          return (
            <Pressable
              style={({ pressed }) => [styles.cardWrap, pressed && styles.cardPressed]}
              onPress={() => router.push({ pathname: '/flight', params: { flightId: item.id } })}
            >
              <GlassCard contentStyle={styles.cardInner}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <Text style={styles.flightNumber}>{item.flight_number}</Text>
                    <Text style={styles.route}>
                      {item.origin}  →  {item.destination}
                    </Text>
                  </View>
                  <View style={styles.cardTopRight}>
                    <View style={[styles.statusRow, { backgroundColor: STATUS_BG[item.status] }]}>
                      <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
                      <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                        {STATUS_LABEL[item.status]}
                      </Text>
                    </View>
                    <Text style={styles.time}>{formatTime(item.departure_time)}</Text>
                  </View>
                </View>

                {/* 3. Mini-compteurs live */}
                <View style={styles.miniStats}>
                  <View style={styles.miniStat}>
                    <Ionicons name="people" size={15} color={colors.muted} />
                    <Text style={styles.miniStatText}>{s.pax} pax</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Ionicons name="bag-handle" size={15} color={colors.muted} />
                    <Text style={styles.miniStatText}>
                      {s.bagOk}/{s.bagTotal} bagages
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardCta}>Travailler sur ce vol</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </View>
              </GlassCard>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(3) },
  headerWrap: { marginBottom: spacing(1) },
  greeting: { color: colors.text, fontSize: 26, fontWeight: '800', marginLeft: spacing(0.5) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), marginTop: spacing(0.5), marginLeft: spacing(0.5), marginBottom: spacing(2) },
  metaDate: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  gateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.5),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.25),
    borderWidth: 1,
    borderColor: colors.border,
  },
  gateChipText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  recap: { flexDirection: 'row', alignItems: 'center', padding: spacing(2), marginBottom: spacing(2) },
  recapItem: { flex: 1, alignItems: 'center', gap: spacing(0.25) },
  recapValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  recapLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  recapDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginVertical: spacing(0.5) },
  miniStats: { flexDirection: 'row', gap: spacing(2.5), marginTop: spacing(1.5) },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: spacing(0.5) },
  miniStatText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  intro: { color: colors.muted, fontSize: 14, fontWeight: '600', marginBottom: spacing(1.5), marginLeft: spacing(0.5) },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing(4) },
  blockTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: spacing(2), marginBottom: spacing(1), textAlign: 'center' },
  blockText: { color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  cardWrap: { marginBottom: spacing(2) },
  cardInner: { padding: spacing(2.5) },
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTopLeft: { flex: 1 },
  cardTopRight: { alignItems: 'flex-end' },
  flightNumber: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  route: { color: colors.muted, fontSize: 15, marginTop: 2, fontWeight: '600' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.75),
    paddingHorizontal: spacing(1.25),
    paddingVertical: spacing(0.5),
    borderRadius: radius.pill,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  time: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: spacing(0.75) },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(2),
    paddingTop: spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardCta: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
