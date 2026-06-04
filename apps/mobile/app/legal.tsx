import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { colors, radius, spacing } from '@/theme';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';
const UPDATED = 'Juin 2026';

export default function Legal() {
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

        <GlassCard strong rounded={radius.xl} contentStyle={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="shield-checkmark" size={30} color={colors.onPrimary} />
          </View>
          <Text style={styles.name}>Mentions légales & confidentialité</Text>
          <Text style={styles.tagline}>Police Bagage · ATS Handling</Text>
          <Text style={styles.updated}>Dernière mise à jour : {UPDATED}</Text>
        </GlassCard>

        {/* Conditions d'utilisation */}
        <Text style={styles.sectionTitle}>Conditions d'utilisation</Text>
        <GlassCard contentStyle={styles.card}>
          <Para>
            Police Bagage est un outil professionnel réservé aux agents et superviseurs autorisés d'ATS Handling. Son
            accès est strictement limité au personnel disposant d'un compte nominatif fourni par l'administrateur.
          </Para>
          <Para>
            L'application sert exclusivement au contrôle des boarding pass et des étiquettes bagage dans le cadre de la
            lutte contre la fraude bagages. Toute utilisation à d'autres fins est interdite.
          </Para>
          <Para>
            L'agent s'engage à préserver la confidentialité de ses identifiants et à ne pas les partager. Toute action
            réalisée depuis un compte engage la responsabilité de son titulaire.
          </Para>
        </GlassCard>

        {/* Confidentialité */}
        <Text style={styles.sectionTitle}>Confidentialité des données</Text>
        <GlassCard contentStyle={styles.card}>
          <Para>
            Les données traitées (passagers, bagages, vols, alertes) proviennent des opérations d'embarquement et sont
            hébergées de façon sécurisée. Elles ne sont accessibles qu'aux personnes habilitées.
          </Para>
          <Para>
            L'application ne collecte aucune donnée personnelle de l'agent à des fins commerciales et n'intègre aucun
            traceur publicitaire. Les seules informations conservées sur l'appareil sont la session de connexion et les
            préférences locales (par ex. les vibrations).
          </Para>
          <Para>
            Les données de scan sont transmises au système central uniquement pour assurer le suivi anti-fraude et la
            génération des rapports destinés aux superviseurs.
          </Para>
        </GlassCard>

        {/* Sécurité */}
        <Text style={styles.sectionTitle}>Sécurité</Text>
        <GlassCard contentStyle={styles.card}>
          <Para>
            Les échanges entre l'application et les serveurs sont chiffrés. En cas de perte ou de vol de l'appareil,
            prévenez immédiatement votre superviseur afin de révoquer l'accès du compte concerné.
          </Para>
          <Para>
            Déconnectez-vous à la fin de votre service. Toute tentative de contournement des règles anti-fraude est
            tracée et signalée.
          </Para>
        </GlassCard>

        {/* Éditeur */}
        <Text style={styles.sectionTitle}>Éditeur</Text>
        <GlassCard contentStyle={styles.card}>
          <Row label="Application" value="Police Bagage" />
          <Divider />
          <Row label="Éditeur" value="African Transport Systems (ATS Handling)" />
          <Divider />
          <Row label="Version" value={VERSION} />
        </GlassCard>

        <Text style={styles.footer}>© 2026 ATS Handling · Tous droits réservés</Text>
      </ScrollView>
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
  hero: { padding: spacing(3), alignItems: 'center', marginTop: spacing(0.5) },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1.5),
  },
  name: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  tagline: { color: colors.muted, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: spacing(0.5) },
  updated: { color: colors.muted, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: spacing(1) },
  sectionTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing(1),
    marginLeft: spacing(0.5),
  },
  card: { padding: spacing(2.5), gap: spacing(1.5) },
  body: { color: colors.text, fontSize: 14.5, lineHeight: 22, fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing(1.5), gap: spacing(2) },
  rowLabel: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border },
  footer: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: spacing(2) },
});
