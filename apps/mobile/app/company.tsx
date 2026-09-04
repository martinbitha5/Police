import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Airplane,
  Buildings,
  Desktop,
  FileText,
  ForkKnife,
  Package,
  ShieldCheck,
  Sparkle,
  SuitcaseRolling,
  Users,
  Wrench,
} from 'phosphor-react-native';
import {
  Divider,
  Header,
  IconBubble,
  ListRow,
  Screen,
  ScreenScroll,
  Spacer,
  Surface,
  Text,
  useTheme,
} from '@/ui';

type ServiceIcon = React.ComponentType<{ size?: number; color?: string }>;

const SERVICES: { Icon: ServiceIcon; label: string }[] = [
  { Icon: Airplane, label: 'Assistance au sol' },
  { Icon: Package, label: 'Cargo & Fret' },
  { Icon: SuitcaseRolling, label: 'Manutention bagages' },
  { Icon: ShieldCheck, label: 'Sûreté aéroportuaire' },
  { Icon: Users, label: 'Passage' },
  { Icon: FileText, label: 'Contrôle documents' },
  { Icon: Wrench, label: 'Maintenance' },
  { Icon: Desktop, label: 'Support informatique' },
  { Icon: Sparkle, label: 'Cleaning aéronefs' },
  { Icon: ForkKnife, label: 'Catering' },
];

export default function Company() {
  const theme = useTheme();
  const router = useRouter();

  // Lecture longue : interligne relâché, plutôt que le 1,5 du courant.
  const paragraph = { lineHeight: Math.round(theme.fontSize.base * theme.lineHeight.relaxed) };

  return (
    <Screen>
      <Header title="Entreprise" onBack={() => router.back()} />

      <ScreenScroll>
        {/* Identité */}
        <View style={[styles.identity, { paddingVertical: theme.spacing.lg }]}>
          <IconBubble size={72} tone="neutral">
            <Buildings size={theme.iconSize.xl} color={theme.colors.text} />
          </IconBubble>
          <Spacer size="base" />
          <Text variant="h1" align="center">
            African Transport Systems
          </Text>
          <Text
            variant="body"
            color="textSecondary"
            align="center"
            style={{ marginTop: theme.spacing.xxs }}
          >
            ATS Handling · Services aéroportuaires en RDC
          </Text>
        </View>

        <Spacer size="lg" />

        {/* Mission */}
        <Text variant="label" color="textMuted" uppercase>
          Mission
        </Text>
        <Spacer size="sm" />
        <Text variant="bodyStrong" style={paragraph}>
          « Allier technicités et technologies modernes pour des services aéroportuaires aux
          standards modernes »
        </Text>

        <Spacer size="xl" />

        {/* À propos */}
        <Text variant="label" color="textMuted" uppercase>
          À propos
        </Text>
        <Spacer size="sm" />
        <Text variant="body" style={paragraph}>
          African Transport Systems est un prestataire de services aéroportuaires et de manutention
          présent dans les principaux aéroports de la République Démocratique du Congo. La société
          innove continuellement dans le secteur du handling pour offrir des prestations fiables et
          sécurisées.
        </Text>

        <Spacer size="xl" />

        {/* Services */}
        <Text variant="label" color="textMuted" uppercase>
          Nos services
        </Text>
        <Spacer size="sm" />
        <Surface
          elevation={0}
          bordered
          padding="none"
          style={{ paddingHorizontal: theme.spacing.base }}
        >
          {SERVICES.map(({ Icon, label }, index) => (
            <React.Fragment key={label}>
              {index > 0 ? <Divider /> : null}
              <ListRow
                title={label}
                icon={<Icon size={theme.iconSize.sm} color={theme.colors.text} />}
              />
            </React.Fragment>
          ))}
        </Surface>

        <Spacer size="2xl" />

        <Text variant="caption" color="textMuted" align="center">
          Système anti-fraude bagages · Police Bagage
        </Text>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center' },
});
