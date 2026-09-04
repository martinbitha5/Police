import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowSquareOut,
  CaretRight,
  EnvelopeSimple,
  Globe,
  Headset,
  MapPin,
  Phone,
} from 'phosphor-react-native';
import {
  Badge,
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

const PHONE = '+243819929881';
const PHONE_DISPLAY = '+243 819 929 881';
const EMAIL = 'contact@ats-handling-rdc.com';
const WEBSITE = 'https://www.ats-handling-rdc.com';

const LOCATIONS = [
  'Kinshasa',
  'Kisangani',
  'Goma',
  'Lubumbashi',
  'Kindu',
  'Kananga',
  'Mbuji-Mayi',
  'Gemena',
  'Mbandaka',
];

export default function Contact() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <Header title="Contact" onBack={() => router.back()} />

      <ScreenScroll>
        {/* Identité */}
        <View style={[styles.identity, { paddingVertical: theme.spacing.lg }]}>
          <IconBubble size={72} tone="neutral">
            <Headset size={theme.iconSize.xl} color={theme.colors.text} />
          </IconBubble>
          <Spacer size="base" />
          <Text variant="h1" align="center">
            ATS Handling
          </Text>
          <Text
            variant="body"
            color="textSecondary"
            align="center"
            style={{ marginTop: theme.spacing.xxs }}
          >
            Nous joindre
          </Text>
        </View>

        <Spacer size="lg" />

        {/* Coordonnées */}
        <Text variant="label" color="textMuted" uppercase>
          Coordonnées
        </Text>
        <Spacer size="sm" />
        <Surface
          elevation={0}
          bordered
          padding="none"
          style={{ paddingHorizontal: theme.spacing.base }}
        >
          <ListRow
            title="Téléphone"
            subtitle={PHONE_DISPLAY}
            icon={<Phone size={theme.iconSize.sm} color={theme.colors.text} />}
            onPress={() => Linking.openURL(`tel:${PHONE}`)}
            right={<CaretRight size={theme.iconSize.sm} color={theme.colors.textMuted} />}
          />
          <Divider />
          <ListRow
            title="Email"
            subtitle={EMAIL}
            icon={<EnvelopeSimple size={theme.iconSize.sm} color={theme.colors.text} />}
            onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
            right={<CaretRight size={theme.iconSize.sm} color={theme.colors.textMuted} />}
          />
          <Divider />
          <ListRow
            title="Site web"
            subtitle="ats-handling-rdc.com"
            icon={<Globe size={theme.iconSize.sm} color={theme.colors.text} />}
            onPress={() => Linking.openURL(WEBSITE)}
            right={<ArrowSquareOut size={theme.iconSize.sm} color={theme.colors.textMuted} />}
          />
        </Surface>

        <Spacer size="xl" />

        {/* Siège social */}
        <Text variant="label" color="textMuted" uppercase>
          Siège social
        </Text>
        <Spacer size="sm" />
        <Surface elevation={0} bordered padding="base">
          <View style={[styles.addressRow, { gap: theme.spacing.md }]}>
            <MapPin
              size={theme.iconSize.sm}
              color={theme.colors.text}
              style={{ marginTop: theme.spacing.xxs }}
            />
            <Text variant="body" style={{ flex: 1 }}>
              11ème niveau, Immeuble Equity BCDC{'\n'}n°15 Boulevard du 30 juin{'\n'}Kinshasa,
              Commune de la Gombe, RDC
            </Text>
          </View>
        </Surface>

        <Spacer size="xl" />

        {/* Présence opérationnelle */}
        <Text variant="label" color="textMuted" uppercase>
          Présence opérationnelle
        </Text>
        <Spacer size="sm" />
        <Surface elevation={0} bordered padding="base">
          <View style={[styles.chips, { gap: theme.spacing.sm }]}>
            {LOCATIONS.map((city) => (
              <Badge key={city} label={city} tone="neutral" />
            ))}
          </View>
        </Surface>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
