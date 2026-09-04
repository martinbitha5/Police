import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AirplaneLanding,
  AirplaneTakeoff,
  AirplaneTilt,
  ArrowsClockwise,
  CaretRight,
  Lock,
  Package,
  PaperPlaneTilt,
  QrCode,
  ShoppingCart,
  Stack,
  Suitcase,
  type Icon,
} from 'phosphor-react-native';
import type { FlightOperation, FlightStatus } from '@police/shared';
import {
  FLIGHT_LOCK_REASON,
  FLIGHT_STATUS_LABEL,
  formatRoute,
  isFlightLocked,
  operationAllowed,
  stationRole,
  stationRoleSummary,
} from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import {
  Badge,
  Divider,
  EmptyState,
  Header,
  ListRow,
  Row,
  Screen,
  ScreenScroll,
  SectionHeader,
  Skeleton,
  Surface,
  Text,
  useTheme,
  type StatusTone,
} from '@/ui';

/** Ton du badge de statut : la couleur signale l'état du vol, elle ne décore pas. */
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
  if (!ts) return '--:--';
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
  icon: Icon;
  title: string;
  subtitle: string;
  /** Verrouillé quand la porte est fermée ou le vol annulé. */
  lockOnClosed?: boolean;
}[] = [
  {
    op: 'checkin',
    path: '/checkin',
    icon: QrCode,
    title: 'Check-in',
    subtitle: 'Scanner les boarding pass',
    lockOnClosed: true,
  },
  {
    op: 'baggage',
    path: '/baggage',
    icon: Suitcase,
    title: 'Bagages',
    subtitle: 'Scanner les étiquettes bagage',
  },
  {
    op: 'expedition_rush',
    path: '/expedition-rush',
    icon: PaperPlaneTilt,
    title: 'Expédition rush',
    subtitle: 'Bagages voyageant sans passager',
  },
  {
    op: 'embarquement',
    path: '/embarquement',
    icon: AirplaneTakeoff,
    title: 'Embarquement',
    subtitle: 'Confirmer les passagers à la porte',
    lockOnClosed: true,
  },
  {
    op: 'dolly',
    path: '/dolly',
    icon: ShoppingCart,
    title: 'Dolly',
    subtitle: 'Contrôle rayon X, bagages sûrs vers le chargement',
  },
  {
    op: 'charger',
    path: '/charger',
    icon: Package,
    title: 'Charger',
    subtitle: 'Bagages chargés en soute pour la destination',
  },
  {
    op: 'rush',
    path: '/rush',
    icon: ArrowsClockwise,
    title: 'Restants',
    subtitle: 'Bagages de ce vol restés au sol, à réacheminer',
  },
  {
    op: 'soute',
    path: '/soute',
    icon: Stack,
    title: 'Soute',
    subtitle: 'Identifier le compartiment de chargement',
  },
  {
    op: 'arrivee',
    path: '/arrivee',
    icon: AirplaneLanding,
    title: 'Arrivée',
    subtitle: 'Réceptionner les bagages à destination',
  },
];

export default function FlightDetail() {
  const theme = useTheme();
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
  const isLocked = flight ? isFlightLocked(flight.status) : false;
  const lockReason = (flight && FLIGHT_LOCK_REASON[flight.status]) ?? 'Vol verrouillé';

  if (loading && !flight) {
    return (
      <Screen>
        <Header onBack={() => router.back()} />
        <View style={{ paddingHorizontal: theme.screenPadding, gap: theme.spacing.base }}>
          <Skeleton height={196} radius={theme.radius.md} />
          <Skeleton height={28} width="40%" />
          <Skeleton height={320} radius={theme.radius.md} />
        </View>
      </Screen>
    );
  }

  if (!flight) {
    return (
      <Screen>
        <Header onBack={() => router.back()} />
        <EmptyState
          title="Vol introuvable"
          description="Ce vol ne figure plus dans la journée en cours."
          icon={<AirplaneTilt size={theme.iconSize.xl} color={theme.colors.textMuted} weight="duotone" />}
        />
      </Screen>
    );
  }

  // Ce que l'agent peut faire dépend de la place de SON aéroport sur CE vol,
  // pas de son compte : le même agent prépare le départ de son vol du matin et
  // réceptionne l'avion qui rentre l'après-midi.
  const role = stationRole(flight, profile?.airport_code);
  const available = OPERATIONS.filter((o) => operationAllowed(o.op, role));
  const summary = stationRoleSummary(role, flight);

  return (
    <Screen>
      <Header
        title={flight.flight_number}
        subtitle={formatRoute(flight, ' · ')}
        onBack={() => router.back()}
      />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        {/* Carte vol : route, horaires, statut, compteurs. */}
        <Surface elevation={0} bordered padding="base">
          <Row>
            <View style={styles.routePoint}>
              <Text variant="h1" tabular>
                {flight.origin}
              </Text>
              <Text variant="caption" color="textSecondary" tabular>
                {formatTime(flight.departure_time)}
              </Text>
            </View>

            <AirplaneTilt size={theme.iconSize.md} color={theme.colors.textSecondary} />

            <View style={[styles.routePoint, styles.routeEnd]}>
              <Text variant="h1" tabular>
                {flight.destination}
              </Text>
              <Text variant="caption" color="textSecondary" tabular>
                {formatTime(flight.arrival_time)}
              </Text>
            </View>
          </Row>

          <Badge
            label={FLIGHT_STATUS_LABEL[flight.status]}
            tone={STATUS_TONE[flight.status]}
            dot
            style={{ marginTop: theme.spacing.md }}
          />

          <Divider spacing="md" />

          <Row>
            <Counter label="Passagers" value={String(pax)} />
            <Counter label="Bagages" value={`${bagOk} / ${bagTotal}`} />
            <Counter label="Embarqués" value={`${boarded} / ${pax}`} />
          </Row>
        </Surface>

        <View>
          <SectionHeader title="Opérations" style={{ marginBottom: summary ? theme.spacing.xs : 0 }} />
          {summary ? (
            <Text variant="body" color="textSecondary">
              {summary}
            </Text>
          ) : null}
        </View>

        <Surface elevation={0} bordered padding="none" style={{ paddingHorizontal: theme.spacing.base }}>
          {available.map((o, index) => {
            const locked = Boolean(o.lockOnClosed && isLocked);
            return (
              <View key={o.op}>
                {index > 0 ? <Divider /> : null}
                {locked ? (
                  <LockedRow title={o.title} reason={lockReason} />
                ) : (
                  <ListRow
                    title={o.title}
                    subtitle={o.subtitle}
                    icon={<o.icon size={theme.iconSize.md} color={theme.colors.text} />}
                    right={<CaretRight size={theme.iconSize.sm} color={theme.colors.textMuted} />}
                    onPress={() => router.push({ pathname: o.path, params: { flightId: flight.id } })}
                  />
                )}
              </View>
            );
          })}
        </Surface>
      </ScreenScroll>
    </Screen>
  );
}

/** Compteur d'en-tête : chiffre tabulaire au-dessus de son libellé. */
function Counter({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.counter}>
      <Text variant="priceLarge" tabular>
        {value}
      </Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

/**
 * Ligne d'opération verrouillée : même gabarit que `ListRow`, mais le titre
 * passe en gris et rien ne se presse. Le sous-titre dit pourquoi.
 */
function LockedRow({ title, reason }: { title: string; reason: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityState={{ disabled: true }}
      style={[styles.lockedRow, { paddingVertical: theme.spacing.base }]}
    >
      <View style={{ width: 32, marginRight: theme.spacing.md }}>
        <Lock size={theme.iconSize.md} color={theme.colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body" color="textMuted" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={2} style={{ marginTop: 1 }}>
          {reason}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  routePoint: { alignItems: 'flex-start' },
  routeEnd: { alignItems: 'flex-end' },
  counter: { flex: 1, alignItems: 'center' },
  lockedRow: { flexDirection: 'row', alignItems: 'center' },
});
