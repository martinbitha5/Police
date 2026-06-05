import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BaggageLoadAllResult } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { loadAllBaggage } from '@/api';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { feedbackSuccess, feedbackWarning } from '@/feedback';
import { colors, radius, spacing } from '@/theme';

export default function Charger() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BaggageLoadAllResult | null>(null);
  const pad = useSafePadding();

  async function onLoad() {
    if (!flightId || busy) return;
    setBusy(true);
    try {
      const res = await loadAllBaggage(flightId, profile?.id);
      setResult(res);
      if (res.status === 'accepted') feedbackSuccess();
      else feedbackWarning();
    } catch (e) {
      setResult({ status: 'rejected', message: (e as Error).message });
      feedbackWarning();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
        <GlassCard strong contentStyle={styles.header}>
          <View>
            <Text style={styles.flight}>{flight?.flight_number ?? '—'}</Text>
            <Text style={styles.route}>
              {flight ? `${flight.origin}  →  ${flight.destination}` : 'Chargement…'}
            </Text>
          </View>
          <View style={styles.modePill}>
            <Text style={styles.modeText}>SOUTE</Text>
          </View>
        </GlassCard>

        <GlassCard contentStyle={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Scannez d'abord les bagages <Text style={{ fontWeight: '800', color: colors.warning }}>Rush</Text> (restants).
            Ensuite, chargez en soute tous les bagages enregistrés restants d'un seul geste.
          </Text>
        </GlassCard>

        <GlassCard strong rounded={radius.xl} contentStyle={styles.stage}>
          <View style={styles.bigIcon}>
            <Ionicons name="cube" size={48} color={colors.accent} />
          </View>
          <Text style={styles.stageTitle}>Charger en soute</Text>
          <Text style={styles.stageHint}>Tous les bagages enregistrés non-rush</Text>

          <Pressable
            style={({ pressed }) => [styles.button, busy && styles.buttonDisabled, pressed && styles.buttonPressed]}
            onPress={onLoad}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Charger les bagages</Text>
            )}
          </Pressable>
        </GlassCard>

        {result ? (
          result.status === 'accepted' ? (
            <GlassCard strong contentStyle={[styles.result, { borderLeftWidth: 4, borderLeftColor: colors.success }]}>
              <Text style={styles.resultBig}>{result.loaded}</Text>
              <Text style={styles.resultLabel}>bagage(s) chargé(s) en soute</Text>
              <View style={styles.resultRow}>
                <ResultStat label="Déjà chargés" value={result.alreadyLoaded} />
                <ResultStat label="Rush exclus" value={result.rushed} tint={colors.warning} />
                <ResultStat label="Enregistrés" value={result.confirmed} />
              </View>
              <Text style={styles.resultMsg}>{result.message}</Text>
            </GlassCard>
          ) : (
            <View style={[styles.result, styles.resultWarn]}>
              <Text style={styles.resultBadge}>⚠️ {result.message}</Text>
            </View>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

function ResultStat({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <View style={styles.rStat}>
      <Text style={[styles.rStatValue, tint ? { color: tint } : null]}>{value}</Text>
      <Text style={styles.rStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing(2), gap: spacing(2) },
  header: { padding: spacing(2.5), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flight: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  route: { color: colors.muted, fontSize: 15, marginTop: 2, fontWeight: '600' },
  modePill: { borderWidth: 1.5, borderColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5) },
  modeText: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: colors.accent },
  infoCard: { flexDirection: 'row', gap: spacing(1.5), padding: spacing(2), alignItems: 'flex-start' },
  infoText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  stage: { paddingVertical: spacing(3), alignItems: 'center', gap: spacing(0.5) },
  bigIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing(1) },
  stageTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  stageHint: { color: colors.muted, fontSize: 14, marginBottom: spacing(1.5) },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(2), paddingHorizontal: spacing(4), alignItems: 'center', justifyContent: 'center', minWidth: 220, minHeight: 54 },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { backgroundColor: colors.primaryDark },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800' },
  result: { padding: spacing(2.5), alignItems: 'center' },
  resultWarn: { backgroundColor: colors.warningBg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.warningBorder },
  resultBig: { color: colors.success, fontSize: 44, fontWeight: '900', lineHeight: 48 },
  resultLabel: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 2 },
  resultRow: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(2) },
  rStat: { alignItems: 'center', minWidth: 72 },
  rStatValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  rStatLabel: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  resultMsg: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: spacing(1.5), textAlign: 'center' },
  resultBadge: { color: colors.warning, fontWeight: '800', fontSize: 15, textAlign: 'center' },
});
