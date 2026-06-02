import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { colors, radius, spacing } from '@/theme';

const SERVICES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'airplane', label: 'Assistance au sol' },
  { icon: 'cube', label: 'Cargo & Fret' },
  { icon: 'bag-handle', label: 'Manutention bagages' },
  { icon: 'shield-checkmark', label: 'Sûreté aéroportuaire' },
  { icon: 'people', label: 'Passage' },
  { icon: 'document-text', label: 'Contrôle documents' },
  { icon: 'construct', label: 'Maintenance' },
  { icon: 'desktop', label: 'Support informatique' },
  { icon: 'sparkles', label: 'Cleaning aéronefs' },
  { icon: 'restaurant', label: 'Catering' },
];

export default function Company() {
  const router = useRouter();
  const pad = useSafePadding();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>

        {/* Identité */}
        <GlassCard strong rounded={radius.xl} contentStyle={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>ATS</Text>
          </View>
          <Text style={styles.name}>African Transport Systems</Text>
          <Text style={styles.tagline}>ATS Handling · Services aéroportuaires en RDC</Text>
        </GlassCard>

        {/* Mission */}
        <Text style={styles.sectionTitle}>Mission</Text>
        <GlassCard contentStyle={styles.card}>
          <Text style={styles.quote}>
            « Allier technicités et technologies modernes pour des services aéroportuaires aux standards modernes »
          </Text>
        </GlassCard>

        {/* À propos */}
        <Text style={styles.sectionTitle}>À propos</Text>
        <GlassCard contentStyle={styles.card}>
          <Text style={styles.body}>
            African Transport Systems est un prestataire de services aéroportuaires et de manutention présent dans les
            principaux aéroports de la République Démocratique du Congo. La société innove continuellement dans le
            secteur du handling pour offrir des prestations fiables et sécurisées.
          </Text>
        </GlassCard>

        {/* Services */}
        <Text style={styles.sectionTitle}>Nos services</Text>
        <GlassCard contentStyle={styles.servicesCard}>
          {SERVICES.map((s, i) => (
            <View key={s.label} style={[styles.serviceRow, i < SERVICES.length - 1 && styles.serviceDivider]}>
              <View style={styles.serviceIcon}>
                <Ionicons name={s.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </View>
          ))}
        </GlassCard>

        <Text style={styles.footer}>Système anti-fraude bagages · Police Bagage</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing(2), gap: spacing(1.5) },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: spacing(0.5) },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  hero: { padding: spacing(3), alignItems: 'center', marginTop: spacing(0.5) },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1.5),
  },
  logoText: { color: colors.onPrimary, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  tagline: { color: colors.muted, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: spacing(0.5) },
  sectionTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing(1),
    marginLeft: spacing(0.5),
  },
  card: { padding: spacing(2.5) },
  quote: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 24, fontStyle: 'italic' },
  body: { color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: '500' },
  servicesCard: { paddingHorizontal: spacing(2) },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), paddingVertical: spacing(1.5) },
  serviceDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  serviceIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  footer: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: spacing(2) },
});
