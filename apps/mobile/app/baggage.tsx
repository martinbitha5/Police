import { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { BaggageScanResult } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanBaggage } from '@/api';
import { HiddenScanner } from '@/HiddenScanner';
import { ScanLottie, type ScanState } from '@/ScanLottie';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { feedbackSuccess, feedbackWarning, feedbackFraud } from '@/feedback';
import { colors, radius, spacing } from '@/theme';

export default function Baggage() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight, statsFor } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const { bagOk, bagTotal } = flightId ? statsFor(flightId) : { bagOk: 0, bagTotal: 0 };
  const [last, setLast] = useState<BaggageScanResult | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);
  const pad = useSafePadding();

  async function onScan(tag: string) {
    if (!flightId) return;
    scanSeq.current += 1;
    try {
      const res = await scanBaggage(tag, flightId, profile?.gate ?? null, profile?.id);
      setLast(res);
      if (res.status === 'accepted') {
        setScanState('success');
        feedbackSuccess();
      } else {
        setScanState('error');
        if (res.fraudAlert) feedbackFraud();
        else feedbackWarning();
      }
    } catch (e) {
      setLast({ status: 'rejected', reason: 'Bagage déjà enregistré', fraudAlert: false, message: (e as Error).message });
      setScanState('error');
      feedbackWarning();
    }
  }

  const accepted = last?.status === 'accepted';
  const isFraud = last?.status === 'rejected' && last.fraudAlert;

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
        <HiddenScanner onScan={onScan} />

        {/* En-tête vol */}
        <GlassCard strong contentStyle={styles.header}>
          <View>
            <Text style={styles.flight}>{flight?.flight_number ?? '—'}</Text>
            <Text style={styles.route}>
              {flight ? `${flight.origin}  →  ${flight.destination}` : 'Chargement…'}
            </Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countNum}>
              {bagOk}/{bagTotal}
            </Text>
            <Text style={styles.countLabel}>bagages</Text>
          </View>
        </GlassCard>

        {/* Scène de scan animée */}
        <GlassCard strong rounded={radius.xl} contentStyle={styles.stage}>
          <ScanLottie state={scanState} replayKey={scanSeq.current} size={210} />
          <Text style={styles.stageTitle}>
            {scanState === 'success'
              ? 'Bagage confirmé'
              : scanState === 'error'
                ? isFraud
                  ? '🚨 Alerte fraude'
                  : 'Bagage refusé'
                : 'Scannez une étiquette'}
          </Text>
          <Text style={styles.stageHint}>
            {scanState === 'scanning' ? 'En attente de lecture…' : 'Prêt pour le prochain scan'}
          </Text>
        </GlassCard>

        {/* Carte de résultat */}
        {last ? (
          accepted ? (
            <GlassCard strong contentStyle={[styles.result, styles.resultOk]}>
              <Text style={styles.resultName}>{last.passengerName}</Text>
              <View style={styles.progressRow}>
                <Text style={styles.progressNum}>
                  {last.confirmedCount}/{last.declaredCount}
                </Text>
                <Text style={styles.progressLabel}>bagages confirmés</Text>
              </View>
              <View style={styles.dots}>
                {Array.from({ length: last.declaredCount }, (_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i < last.confirmedCount ? styles.dotOn : styles.dotOff]}
                  />
                ))}
              </View>
            </GlassCard>
          ) : (
            <View style={[styles.result, isFraud ? styles.resultFraud : styles.resultWarn]}>
              <Text style={[styles.resultBadge, isFraud ? styles.badgeFraud : styles.badgeWarn]}>
                {isFraud ? '🚨 FRAUDE' : '⚠️ REJET'}
              </Text>
              <Text style={styles.resultReason}>{last.reason}</Text>
              <Text style={styles.resultMessage}>{last.message}</Text>
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
  header: {
    padding: spacing(2.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flight: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  route: { color: colors.muted, fontSize: 15, marginTop: 2, fontWeight: '600' },
  countPill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  countNum: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  countLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  stage: {
    paddingVertical: spacing(3),
    alignItems: 'center',
  },
  stageTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: spacing(1), textAlign: 'center' },
  stageHint: { color: colors.muted, fontSize: 14, marginTop: 2 },
  result: { padding: spacing(2.5), alignItems: 'center' },
  resultOk: { borderLeftWidth: 4, borderLeftColor: colors.success },
  resultFraud: { backgroundColor: colors.dangerBg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.dangerBorder },
  resultWarn: { backgroundColor: colors.warningBg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.warningBorder },
  resultName: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing(1), marginTop: spacing(1) },
  progressNum: { color: colors.success, fontSize: 28, fontWeight: '800' },
  progressLabel: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: spacing(1), marginTop: spacing(1.5) },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dotOn: { backgroundColor: colors.success },
  dotOff: { backgroundColor: colors.border },
  resultBadge: { fontWeight: '900', fontSize: 14, letterSpacing: 1, marginBottom: spacing(0.5) },
  badgeFraud: { color: colors.danger },
  badgeWarn: { color: colors.warning },
  resultReason: { color: colors.text, fontSize: 19, fontWeight: '800', textAlign: 'center', marginTop: 2 },
  resultMessage: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing(0.5), fontWeight: '600' },
});
