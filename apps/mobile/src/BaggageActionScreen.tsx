import { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { BaggageActionResult } from '@police/shared';
import { useAuth } from './auth';
import { useFlights } from './flights-store';
import { loadBaggage, rushBaggage } from './api';
import { HiddenScanner } from './HiddenScanner';
import { ScanLottie, type ScanState } from './ScanLottie';
import { ScreenBackground, GlassCard, useSafePadding } from './Glass';
import { feedbackSuccess, feedbackWarning } from './feedback';
import { colors, radius, spacing } from './theme';

type Mode = 'load' | 'rush';

const CONFIG: Record<Mode, { title: string; hint: string; okTitle: string; tint: string }> = {
  load: {
    title: 'Charger en soute',
    hint: 'Scannez chaque bagage qui entre en soute',
    okTitle: 'Chargé en soute',
    tint: colors.success,
  },
  rush: {
    title: 'Réacheminement (Rush)',
    hint: 'Scannez les bagages restants à réacheminer',
    okTitle: 'Marqué pour réacheminement',
    tint: colors.warning,
  },
};

export function BaggageActionScreen({ mode }: { mode: Mode }) {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const [last, setLast] = useState<BaggageActionResult | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);
  const pad = useSafePadding();
  const cfg = CONFIG[mode];

  async function onScan(tag: string) {
    if (!flightId) return;
    scanSeq.current += 1;
    try {
      const res = mode === 'load'
        ? await loadBaggage(tag, flightId, profile?.id)
        : await rushBaggage(tag, flightId, profile?.id);
      setLast(res);
      if (res.status === 'accepted') {
        setScanState('success');
        feedbackSuccess();
      } else {
        setScanState('error');
        feedbackWarning();
      }
    } catch (e) {
      setLast({ status: 'rejected', message: (e as Error).message });
      setScanState('error');
      feedbackWarning();
    }
  }

  const accepted = last?.status === 'accepted';

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
        <HiddenScanner onScan={onScan} />

        <GlassCard strong contentStyle={styles.header}>
          <View>
            <Text style={styles.flight}>{flight?.flight_number ?? '—'}</Text>
            <Text style={styles.route}>
              {flight ? `${flight.origin}  →  ${flight.destination}` : 'Chargement…'}
            </Text>
          </View>
          <View style={[styles.modePill, { borderColor: cfg.tint }]}>
            <Text style={[styles.modeText, { color: cfg.tint }]}>{mode === 'load' ? 'SOUTE' : 'RUSH'}</Text>
          </View>
        </GlassCard>

        <GlassCard strong rounded={radius.xl} contentStyle={styles.stage}>
          <ScanLottie state={scanState} replayKey={scanSeq.current} size={210} />
          <Text style={styles.stageTitle}>
            {scanState === 'success' ? cfg.okTitle : scanState === 'error' ? 'Refusé' : cfg.title}
          </Text>
          <Text style={styles.stageHint}>
            {scanState === 'scanning' ? cfg.hint : 'Prêt pour le prochain scan'}
          </Text>
        </GlassCard>

        {last ? (
          accepted && last.status === 'accepted' ? (
            <GlassCard strong contentStyle={[styles.result, { borderLeftWidth: 4, borderLeftColor: cfg.tint }]}>
              <Text style={styles.resultName}>{last.passengerName}</Text>
              <Text style={styles.resultTag}>{last.tagNumber}</Text>
              <Text style={[styles.resultMsg, { color: cfg.tint }]}>{last.message}</Text>
            </GlassCard>
          ) : (
            <View style={[styles.result, styles.resultWarn]}>
              <Text style={styles.resultBadge}>⚠️ REFUSÉ</Text>
              <Text style={styles.resultReason}>{last.message}</Text>
            </View>
          )
        ) : null}
      </ScrollView>
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
  modePill: { borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5) },
  modeText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  stage: { paddingVertical: spacing(3), alignItems: 'center' },
  stageTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: spacing(1), textAlign: 'center' },
  stageHint: { color: colors.muted, fontSize: 14, marginTop: 2, textAlign: 'center' },
  result: { padding: spacing(2.5), alignItems: 'center' },
  resultWarn: { backgroundColor: colors.warningBg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.warningBorder },
  resultName: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  resultTag: { color: colors.muted, fontSize: 15, fontWeight: '700', marginTop: 2, fontFamily: 'monospace' },
  resultMsg: { fontSize: 16, fontWeight: '700', marginTop: spacing(1), textAlign: 'center' },
  resultBadge: { color: colors.warning, fontWeight: '900', fontSize: 14, letterSpacing: 1, marginBottom: spacing(0.5) },
  resultReason: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
});
