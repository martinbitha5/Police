import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { colors, radius, spacing } from '@/theme';

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

        <Text style={styles.title}>Contact</Text>

        {/* Coordonnées cliquables */}
        <GlassCard contentStyle={styles.card}>
          <ContactRow
            icon="call"
            label="Téléphone"
            value={PHONE_DISPLAY}
            onPress={() => Linking.openURL(`tel:${PHONE}`)}
          />
          <Divider />
          <ContactRow icon="mail" label="Email" value={EMAIL} onPress={() => Linking.openURL(`mailto:${EMAIL}`)} />
          <Divider />
          <ContactRow
            icon="globe"
            label="Site web"
            value="ats-handling-rdc.com"
            onPress={() => Linking.openURL(WEBSITE)}
          />
        </GlassCard>

        {/* Siège social */}
        <Text style={styles.sectionTitle}>Siège social</Text>
        <GlassCard contentStyle={styles.card}>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.address}>
              11ème niveau, Immeuble Equity BCDC{'\n'}n°15 Boulevard du 30 juin{'\n'}Kinshasa — Commune de la Gombe, RDC
            </Text>
          </View>
        </GlassCard>

        {/* Présence opérationnelle */}
        <Text style={styles.sectionTitle}>Présence opérationnelle</Text>
        <GlassCard contentStyle={styles.chipsCard}>
          <View style={styles.chips}>
            {LOCATIONS.map((city) => (
              <View key={city} style={styles.chip}>
                <Text style={styles.chipText}>{city}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowTexts}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
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
  content: { paddingHorizontal: spacing(2), gap: spacing(1.5) },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: spacing(0.5) },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginLeft: spacing(0.5), marginBottom: spacing(0.5) },
  sectionTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing(1),
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
  rowLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  rowValue: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border },
  addressRow: { flexDirection: 'row', gap: spacing(1.5), padding: spacing(2.5), alignItems: 'flex-start' },
  address: { color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 23, flex: 1 },
  chipsCard: { padding: spacing(2) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
