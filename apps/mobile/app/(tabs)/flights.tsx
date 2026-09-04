import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AirplaneTilt, ArrowRight, CaretRight, Lock, Suitcase, Users } from 'phosphor-react-native';
import { FLIGHT_STATUS_LABEL, hasFlightDeparted, type FlightStatus } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { dayLabel, wrongDay } from '@/clock';
import {
  Badge,
  Divider,
  EmptyState,
  Gauge,
  Header,
  InlineAlert,
  ListSkeleton,
  Pressable,
  Row,
  Screen,
  Skeleton,
  Spacer,
  Surface,
  Text,
  useTabBarPadding,
  useTheme,
  type StatusTone,
} from '@/ui';

function firstName(full: string | null | undefined): string {
  if (!full) return 'Agent';
  const parts = full.trim().split(/\s+/);
  // Format BCBP « NOM Prenom » : on prend le dernier mot comme prénom usuel.
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

function todayLabel(): string {
  const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const STATUS_LABEL = FLIGHT_STATUS_LABEL;

/** La couleur signale l'état du vol : vert quand ça avance, ambre quand ça attend, rouge quand c'est annulé. */
const STATUS_TONE: Record<FlightStatus, StatusTone> = {
  scheduled: 'neutral',
  delayed: 'warning',
  boarding: 'success',
  closed: 'info',
  departed: 'success',
  arrived: 'success',
  cancelled: 'danger',
};

function formatTime(ts: string | null): string {
  if (!ts) return 'Sans horaire';
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Une jauge du récap du jour, ou son squelette tant que les compteurs ne sont
 * pas arrivés : un « 0 » provisoire se lirait comme un vrai zéro.
 */
function RecapGauge({
  value,
  total,
  label,
  ready,
}: {
  value: number;
  total: number;
  label: string;
  ready: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.recapItem}>
      {ready ? (
        <Gauge value={value} total={total} label={label} size={88} stroke={7} />
      ) : (
        <>
          <Skeleton width={88} height={88} radius={44} />
          <Skeleton width={56} height={14} style={{ marginTop: theme.spacing.sm }} />
        </>
      )}
    </View>
  );
}

export default function Flights() {
  const theme = useTheme();
  const router = useRouter();
  const tabBarPadding = useTabBarPadding();
  const { profile } = useAuth();
  const { flights, loading, statsReady, clock, refresh, statsFor } = useFlights();
  const [refreshing, setRefreshing] = useState(false);

  // Récap du jour : somme des stats déjà en cache (pas de requête supplémentaire).
  // Chaque jauge rapporte l'accompli au dû : vols partis sur vols du jour,
  // passagers embarqués sur enregistrés, bagages confirmés sur déclarés.
  const totals = useMemo(() => {
    return flights.reduce(
      (acc, f) => {
        const s = statsFor(f.id);
        acc.pax += s.pax;
        acc.boarded += s.boarded;
        acc.bagTotal += s.bagTotal;
        acc.bagOk += s.bagOk;
        if (hasFlightDeparted(f.status)) acc.departed += 1;
        return acc;
      },
      { pax: 0, boarded: 0, bagTotal: 0, bagOk: 0, departed: 0 },
    );
  }, [flights, statsFor]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const header = <Header title="Vols" large right={<Badge label={todayLabel()} tone="neutral" />} />;

  if (loading) {
    return (
      <Screen>
        {header}
        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <ListSkeleton count={3} />
        </View>
      </Screen>
    );
  }

  // Spec : le mobile est réservé aux agents terrain.
  if (profile && profile.role !== 'agent') {
    return (
      <Screen>
        {header}
        <EmptyState
          title="Accès réservé aux agents"
          description="Le scan terrain est réservé aux comptes agent. Les superviseurs et administrateurs utilisent le dashboard web."
          icon={<Lock size={theme.iconSize.xl} color={theme.colors.textMuted} weight="duotone" />}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <FlatList
        data={flights}
        keyExtractor={(f) => f.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.text}
            colors={[theme.colors.text]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding,
          paddingBottom: tabBarPadding,
          gap: theme.spacing.md,
        }}
        ListHeaderComponent={
          <View>
            {/* 0. Horloge de l'appareil en désaccord avec l'aéroport.
                Cas grave : la liste reste crédible alors qu'elle porte sur un
                autre jour, et les scans partent sur les mauvais vols. */}
            {wrongDay(clock) ? (
              <>
                <InlineAlert
                  tone="warning"
                  message={`Date de cet appareil incorrecte. L'appareil est au ${dayLabel(clock.deviceDay)}, l'aéroport au ${dayLabel(clock.day)}. Les vols ci-dessous sont bien ceux du ${dayLabel(clock.day)}. Faites régler la date de l'appareil et prévenez votre superviseur.`}
                />
                <Spacer size="base" />
              </>
            ) : null}

            {/* 1. Accueil */}
            <Text variant="h2">Bonjour, {firstName(profile?.full_name)}</Text>
            {profile?.gate ? (
              <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
                {profile.gate}
              </Text>
            ) : null}

            <Spacer size="base" />

            {/* 2. Récap du jour */}
            <Surface elevation={0} bordered padding="base">
              <View style={styles.recap}>
                <RecapGauge value={totals.departed} total={flights.length} label="Vols" ready />
                <RecapGauge value={totals.boarded} total={totals.pax} label="Passagers" ready={statsReady} />
                <RecapGauge value={totals.bagOk} total={totals.bagTotal} label="Bagages" ready={statsReady} />
              </View>
              <Text
                variant="caption"
                color="textSecondary"
                align="center"
                style={{ marginTop: theme.spacing.md }}
              >
                Vols décollés, passagers embarqués, bagages confirmés
              </Text>
            </Surface>

            <Spacer size="lg" />

            <Text variant="label" color="textSecondary" style={{ marginBottom: theme.spacing.xs }}>
              Sélectionnez un vol pour commencer
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Aucun vol aujourd'hui"
            icon={
              <AirplaneTilt size={theme.iconSize.xl} color={theme.colors.textMuted} weight="duotone" />
            }
          />
        }
        renderItem={({ item }) => {
          const s = statsFor(item.id);
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/flight', params: { flightId: item.id } })}
              accessibilityLabel={`Vol ${item.flight_number}, ${item.origin} vers ${item.destination}`}
            >
              <Surface elevation={0} bordered padding="base">
                <Row>
                  <Text variant="h2" tabular>
                    {item.flight_number}
                  </Text>
                  <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} dot />
                </Row>

                <Row style={{ marginTop: theme.spacing.xxs }}>
                  <View style={[styles.inline, { gap: theme.spacing.xs }]}>
                    <Text variant="body" color="textSecondary">
                      {item.origin}
                    </Text>
                    <ArrowRight size={theme.iconSize.xs} color={theme.colors.textMuted} />
                    <Text variant="body" color="textSecondary">
                      {item.destination}
                    </Text>
                  </View>
                  <Text variant="bodyStrong" tabular>
                    {formatTime(item.departure_time)}
                  </Text>
                </Row>

                <Divider spacing="md" />

                {/* 3. Compteurs live */}
                <Row>
                  {statsReady ? (
                    <View style={[styles.inline, { gap: theme.spacing.base }]}>
                      <View style={[styles.inline, { gap: theme.spacing.xs }]}>
                        <Users size={theme.iconSize.xs} color={theme.colors.textMuted} />
                        <Text variant="label" color="textSecondary" tabular>
                          {s.pax} passagers
                        </Text>
                      </View>
                      <View style={[styles.inline, { gap: theme.spacing.xs }]}>
                        <Suitcase size={theme.iconSize.xs} color={theme.colors.textMuted} />
                        <Text variant="label" color="textSecondary" tabular>
                          {s.bagOk}/{s.bagTotal} bagages
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Skeleton width={180} height={16} />
                  )}
                  <CaretRight size={theme.iconSize.sm} color={theme.colors.textMuted} />
                </Row>
              </Surface>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  recap: { flexDirection: 'row', alignItems: 'flex-start' },
  recapItem: { flex: 1, alignItems: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center' },
});
