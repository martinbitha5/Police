import { useState } from 'react';
import { ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  ArrowsClockwise,
  Buildings,
  CalendarBlank,
  CaretRight,
  Clock,
  Info,
  Phone,
  ShieldCheck,
  Tag,
  Vibrate,
} from 'phosphor-react-native';
import { hapticsOn, setHaptics } from '@/settings';
import { useFlights } from '@/flights-store';
import { clockSummary, dayLabel, clockIsOff, wrongDay } from '@/clock';
import {
  Badge,
  Divider,
  Header,
  ListRow,
  Screen,
  ScreenScroll,
  Spacer,
  Surface,
  Text,
  useTabBarPadding,
  useTheme,
} from '@/ui';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

/**
 * Journée d'exploitation en clair. On n'affiche les deux dates que lorsqu'elles
 * divergent : c'est le désaccord qui est l'information, pas la date elle-même.
 */
function operatingDayValue(clock: { day: string; serverDay: string | null; deviceDay: string }): string {
  if (!clock.day) return 'Inconnue';
  if (clock.serverDay === null) return `${dayLabel(clock.day)} (appareil, serveur injoignable)`;
  return clock.serverDay === clock.deviceDay
    ? dayLabel(clock.day)
    : `${dayLabel(clock.serverDay)} (aéroport) · ${dayLabel(clock.deviceDay)} (appareil)`;
}

/** Titre de section : petit, gris, en capitales, comme dans la référence. */
function SectionTitle({ title }: { title: string }) {
  return (
    <>
      <Text variant="label" color="textMuted" uppercase>
        {title}
      </Text>
      <Spacer size="sm" />
    </>
  );
}

export default function Settings() {
  const theme = useTheme();
  const tabBarPadding = useTabBarPadding();
  const [haptics, setHapticsState] = useState(hapticsOn());
  const router = useRouter();
  const { clock, refresh } = useFlights();
  const [syncing, setSyncing] = useState(false);

  const toggleHaptics = (v: boolean) => {
    setHapticsState(v);
    void setHaptics(v);
  };

  // Recharge les données. Ne touche pas à la session : un agent en plein
  // embarquement ne doit pas se retrouver à retaper son mot de passe.
  const resynchronise = async () => {
    setSyncing(true);
    try {
      await refresh();
    } finally {
      setSyncing(false);
    }
  };

  const iconColor = theme.colors.text;
  const chevron = <CaretRight size={theme.iconSize.sm} color={theme.colors.textMuted} />;
  // Un statut qui ne va pas se dit avec un mot, jamais avec la couleur seule.
  const alertBadge = <Badge label="À vérifier" tone="warning" size="sm" />;

  return (
    <Screen>
      <Header title="Paramètres" large />

      <ScreenScroll bottomInset={tabBarPadding}>
        <SectionTitle title="Préférences" />
        <Surface padding="none" elevation={0} bordered style={{ paddingHorizontal: theme.spacing.base }}>
          <ListRow
            title="Vibrations au scan"
            subtitle="Retour tactile à chaque résultat"
            icon={<Vibrate size={theme.iconSize.sm} color={iconColor} />}
            right={
              <Switch
                value={haptics}
                onValueChange={toggleHaptics}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
                accessibilityLabel="Vibrations au scan"
              />
            }
          />
        </Surface>

        <Spacer size="xl" />

        <SectionTitle title="Entreprise" />
        <Surface padding="none" elevation={0} bordered style={{ paddingHorizontal: theme.spacing.base }}>
          <ListRow
            title="À propos d'ATS Handling"
            subtitle="African Transport Systems"
            icon={<Buildings size={theme.iconSize.sm} color={iconColor} />}
            onPress={() => router.push('/company')}
            right={chevron}
          />
          <Divider />
          <ListRow
            title="Contact et adresses"
            subtitle="Téléphone, email, présence"
            icon={<Phone size={theme.iconSize.sm} color={iconColor} />}
            onPress={() => router.push('/contact')}
            right={chevron}
          />
        </Surface>

        <Spacer size="xl" />

        <SectionTitle title="Connexion" />
        <Surface padding="none" elevation={0} bordered style={{ paddingHorizontal: theme.spacing.base }}>
          <ListRow
            title="Journée d'exploitation"
            subtitle={operatingDayValue(clock)}
            icon={
              <CalendarBlank
                size={theme.iconSize.sm}
                color={wrongDay(clock) ? theme.colors.warning : iconColor}
              />
            }
            right={wrongDay(clock) ? alertBadge : undefined}
          />
          <Divider />
          <ListRow
            title="Horloge de l'appareil"
            subtitle={clockSummary(clock)}
            icon={
              <Clock size={theme.iconSize.sm} color={clockIsOff(clock) ? theme.colors.warning : iconColor} />
            }
            right={clockIsOff(clock) ? alertBadge : undefined}
          />
          <Divider />
          <ListRow
            title="Resynchroniser"
            subtitle="Recharge vols et compteurs. Ne déconnecte pas."
            icon={<ArrowsClockwise size={theme.iconSize.sm} color={iconColor} />}
            onPress={syncing ? undefined : () => void resynchronise()}
            right={syncing ? <ActivityIndicator color={theme.colors.text} /> : undefined}
          />
        </Surface>

        <Spacer size="xl" />

        <SectionTitle title="Légal" />
        <Surface padding="none" elevation={0} bordered style={{ paddingHorizontal: theme.spacing.base }}>
          <ListRow
            title="Mentions légales et confidentialité"
            subtitle="Conditions d'utilisation, données, sécurité"
            icon={<ShieldCheck size={theme.iconSize.sm} color={iconColor} />}
            onPress={() => router.push('/legal')}
            right={chevron}
          />
        </Surface>

        <Spacer size="xl" />

        <SectionTitle title="À propos" />
        <Surface padding="none" elevation={0} bordered style={{ paddingHorizontal: theme.spacing.base }}>
          <ListRow
            title="Application"
            subtitle="Police Bagage"
            icon={<Info size={theme.iconSize.sm} color={iconColor} />}
          />
          <Divider />
          <ListRow
            title="Version"
            subtitle={VERSION}
            icon={<Tag size={theme.iconSize.sm} color={iconColor} />}
          />
        </Surface>

        <Spacer size="lg" />

        <Text variant="caption" color="textMuted" align="center">
          Police Bagage, contrôle anti-fraude bagages
        </Text>
      </ScreenScroll>
    </Screen>
  );
}
