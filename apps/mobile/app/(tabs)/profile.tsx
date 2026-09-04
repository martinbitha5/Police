import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarBlank, CaretRight, Envelope, MapPin, PencilSimple, SignOut } from 'phosphor-react-native';
import type { UserRole } from '@police/shared';
import { useAuth } from '@/auth';
import { PERIOD_LABEL, STAT_PERIODS, useAgentStats, type StatPeriod } from '@/agent-stats';
import {
  Avatar,
  Button,
  Divider,
  Gauge,
  Header,
  InlineAlert,
  ListRow,
  Screen,
  ScreenScroll,
  Skeleton,
  Spacer,
  Surface,
  Text,
  useTabBarPadding,
  useTheme,
} from '@/ui';

const ROLE_LABEL: Record<UserRole, string> = {
  agent: 'Agent terrain',
  supervisor: 'Superviseur',
  admin: 'Administrateur',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(ts: string | undefined): string {
  if (!ts) return 'Inconnue';
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Le profil de l'agent : une carte d'identité, puis des sections titrées.
 *
 * Le nom complet, pas le seul prénom : c'est le contrôle « suis-je sur le bon
 * compte » sur un PDA partagé entre plusieurs agents.
 */
export default function Profile() {
  const theme = useTheme();
  const tabBarPadding = useTabBarPadding();
  const { profile, session, signOut } = useAuth();
  const router = useRouter();
  const name = profile?.full_name ?? 'Agent';
  const email = session?.user.email ?? 'Non renseigné';

  const activity = useAgentStats();
  const [period, setPeriod] = useState<StatPeriod>('day');
  const [refreshing, setRefreshing] = useState(false);
  const current = activity.stats?.[period] ?? null;

  const onRefresh = async () => {
    setRefreshing(true);
    await activity.refresh();
    setRefreshing(false);
  };

  const identityLine = profile
    ? profile.gate
      ? `${ROLE_LABEL[profile.role]} · ${profile.gate}`
      : ROLE_LABEL[profile.role]
    : null;

  return (
    <Screen>
      <Header title="Profil" large />

      <ScreenScroll
        bottomInset={tabBarPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
            colors={[theme.colors.text]}
          />
        }
      >
        {/* --- Carte d'identité ------------------------------------------- */}
        <Surface padding="base" elevation={0} bordered>
          <View style={styles.identityRow}>
            <Avatar initials={initials(name)} size={64} />
            <View style={{ flex: 1, marginLeft: theme.spacing.base }}>
              <Text variant="h1" numberOfLines={1}>
                {name}
              </Text>
              {identityLine ? (
                <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
                  {identityLine}
                </Text>
              ) : null}
            </View>
          </View>
        </Surface>

        <Spacer size="xl" />

        {/* --- Activité ------------------------------------------------------
            Trois jauges : la part de l'agent dans ce que sa station a traité
            sur la période. Le chiffre est le sien, l'anneau le rapporte au
            total, pour qu'un « 12 » ait un sens sans tableau à côté. */}
        <Text variant="label" color="textMuted" uppercase>
          Activité
        </Text>
        <Spacer size="sm" />

        <Surface padding="base" elevation={0} bordered>
          <View style={[styles.periodRow, { gap: theme.spacing.sm }]}>
            {STAT_PERIODS.map((p) => (
              <Button
                key={p}
                label={PERIOD_LABEL[p]}
                size="sm"
                variant={p === period ? 'primary' : 'secondary'}
                onPress={() => setPeriod(p)}
                accessibilityLabel={`Période : ${PERIOD_LABEL[p]}`}
              />
            ))}
          </View>

          <Spacer size="lg" />

          {activity.loading ? (
            <View style={styles.gaugeRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.gaugeCell}>
                  <Skeleton width={96} height={96} radius={48} />
                  <Skeleton width={56} height={14} style={{ marginTop: theme.spacing.sm }} />
                </View>
              ))}
            </View>
          ) : current ? (
            <View style={styles.gaugeRow}>
              <View style={styles.gaugeCell}>
                <Gauge value={current.flightsMine} total={current.flightsTotal} label="Vols" />
              </View>
              <View style={styles.gaugeCell}>
                <Gauge value={current.paxMine} total={current.paxTotal} label="Passagers" />
              </View>
              <View style={styles.gaugeCell}>
                <Gauge value={current.bagsMine} total={current.bagsTotal} label="Bagages" />
              </View>
            </View>
          ) : (
            <InlineAlert
              tone="warning"
              message="Statistiques indisponibles pour le moment."
              actionLabel="Réessayer"
              onAction={() => void activity.refresh()}
            />
          )}

          {current ? (
            <Text
              variant="caption"
              color="textSecondary"
              align="center"
              style={{ marginTop: theme.spacing.lg }}
            >
              Votre part de ce que la station a traité{' '}
              {period === 'day'
                ? "aujourd'hui"
                : period === 'week'
                  ? 'cette semaine'
                  : period === 'month'
                    ? 'ce mois-ci'
                    : 'cette année'}
              {activity.error ? '. Chiffres du dernier chargement.' : '.'}
            </Text>
          ) : null}
        </Surface>

        <Spacer size="xl" />

        {/* --- Compte ------------------------------------------------------- */}
        <Text variant="label" color="textMuted" uppercase>
          Compte
        </Text>
        <Spacer size="sm" />

        <Surface padding="none" elevation={0} bordered style={{ paddingHorizontal: theme.spacing.base }}>
          <ListRow
            title="Modifier le profil"
            subtitle="Nom complet, mot de passe"
            icon={<PencilSimple size={theme.iconSize.sm} color={theme.colors.text} />}
            onPress={() => router.push('/profile-edit')}
            right={<CaretRight size={theme.iconSize.sm} color={theme.colors.textMuted} />}
          />
        </Surface>

        <Spacer size="xl" />

        {/* --- Informations ------------------------------------------------- */}
        <Text variant="label" color="textMuted" uppercase>
          Informations
        </Text>
        <Spacer size="sm" />

        <Surface padding="none" elevation={0} bordered style={{ paddingHorizontal: theme.spacing.base }}>
          <ListRow
            title="Email"
            subtitle={email}
            icon={<Envelope size={theme.iconSize.sm} color={theme.colors.text} />}
          />
          <Divider />
          <ListRow
            title="Gate assignée"
            subtitle={profile?.gate ?? 'Non assignée'}
            icon={<MapPin size={theme.iconSize.sm} color={theme.colors.text} />}
          />
          <Divider />
          <ListRow
            title="Membre depuis"
            subtitle={formatDate(profile?.created_at)}
            icon={<CalendarBlank size={theme.iconSize.sm} color={theme.colors.text} />}
          />
        </Surface>

        <Spacer size="2xl" />

        {/* --- Déconnexion -------------------------------------------------- */}
        <Surface padding="none" elevation={0} bordered style={{ paddingHorizontal: theme.spacing.base }}>
          <ListRow
            title="Déconnexion"
            icon={<SignOut size={theme.iconSize.sm} color={theme.colors.danger} />}
            onPress={() => void signOut()}
            destructive
          />
        </Surface>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap' },
  gaugeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gaugeCell: { flex: 1, alignItems: 'center' },
});
