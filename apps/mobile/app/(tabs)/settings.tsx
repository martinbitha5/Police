import { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ScreenBackground, GlassCard, useContentPadding } from '@/Glass';
import { colors, radius, spacing } from '@/theme';
import { hapticsOn, setHaptics } from '@/settings';
import { useFlights } from '@/flights-store';
import { clockSummary, dayLabel, clockIsOff, wrongDay } from '@/clock';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api-police.brsats.com';
const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').host;
  } catch {
    return '—';
  }
})();
const VERSION = Constants.expoConfig?.version ?? '1.0.0';

/**
 * Journée d'exploitation en clair. On n'affiche les deux dates que lorsqu'elles
 * divergent : c'est le désaccord qui est l'information, pas la date elle-même.
 */
function operatingDayValue(clock: { day: string; serverDay: string | null; deviceDay: string }): string {
  if (!clock.day) return '—';
  if (clock.serverDay === null) return `${dayLabel(clock.day)} (appareil, serveur injoignable)`;
  return clock.serverDay === clock.deviceDay
    ? dayLabel(clock.day)
    : `${dayLabel(clock.serverDay)} (aéroport) · ${dayLabel(clock.deviceDay)} (appareil)`;
}

export default function Settings() {
  const [haptics, setHapticsState] = useState(hapticsOn());
  const pad = useContentPadding(true);
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

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
      <Section title="Préférences">
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="phone-portrait" size={18} color={colors.primary} />
          </View>
          <View style={styles.rowTexts}>
            <Text style={styles.rowLabel}>Vibrations au scan</Text>
            <Text style={styles.rowHint}>Retour tactile à chaque résultat</Text>
          </View>
          <Switch
            value={haptics}
            onValueChange={toggleHaptics}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
      </Section>

      <Section title="Entreprise">
        <LinkRow
          icon="business"
          label="À propos d'ATS Handling"
          hint="African Transport Systems"
          onPress={() => router.push('/company')}
        />
        <Divider />
        <LinkRow
          icon="call"
          label="Contact & adresses"
          hint="Téléphone, email, présence"
          onPress={() => router.push('/contact')}
        />
      </Section>

      <Section title="Connexion">
        <InfoRow
          icon="calendar"
          label="Journée d'exploitation"
          value={operatingDayValue(clock)}
          alert={wrongDay(clock)}
          lines={2}
        />
        <Divider />
        <InfoRow
          icon="time"
          label="Horloge de l'appareil"
          value={clockSummary(clock)}
          alert={clockIsOff(clock)}
        />
        <Divider />
        <ActionRow
          icon="refresh"
          label="Resynchroniser"
          hint="Recharge vols et compteurs. Ne déconnecte pas."
          busy={syncing}
          onPress={() => void resynchronise()}
        />
        <Divider />
        <InfoRow icon="server" label="Serveur API" value={API_URL} />
        <Divider />
        <InfoRow icon="cloud" label="Base Supabase" value={SUPABASE_HOST} />
      </Section>

      <Section title="Légal">
        <LinkRow
          icon="shield-checkmark"
          label="Mentions légales & confidentialité"
          hint="Conditions d'utilisation, données, sécurité"
          onPress={() => router.push('/legal')}
        />
      </Section>

      <Section title="À propos">
        <InfoRow icon="information-circle" label="Application" value="Police Bagage" />
        <Divider />
        <InfoRow icon="pricetag" label="Version" value={VERSION} />
      </Section>

        <Text style={styles.footer}>Police Bagage · Système anti-fraude bagages</Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <GlassCard contentStyle={styles.card}>{children}</GlassCard>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  alert,
  lines = 1,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  /** Met la valeur en évidence : quelque chose ne va pas et doit se voir. */
  alert?: boolean;
  lines?: number;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={alert ? colors.warning : colors.primary} />
      </View>
      <View style={styles.rowTexts}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, alert && styles.rowValueAlert]} numberOfLines={lines}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  hint,
  busy,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={busy ? undefined : onPress}
      disabled={busy}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowTexts}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      {busy ? <ActivityIndicator color={colors.primary} /> : null}
    </Pressable>
  );
}

function LinkRow({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowTexts}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing(2), gap: spacing(2.5) },
  sectionTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing(1),
    marginLeft: spacing(0.5),
  },
  card: { paddingHorizontal: spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), paddingVertical: spacing(2) },
  rowPressed: { opacity: 0.6 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTexts: { flex: 1 },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  rowHint: { color: colors.muted, fontSize: 12, marginTop: 2, fontWeight: '600' },
  rowValue: { color: colors.muted, fontSize: 13, marginTop: 2, fontWeight: '600' },
  rowValueAlert: { color: colors.warning, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border },
  footer: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: spacing(1) },
});
