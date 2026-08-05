import { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ArrivalScanResult } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanArrivee } from '@/api';
import { HiddenScanner } from '@/HiddenScanner';
import { ScanLottie, type ScanState } from '@/ScanLottie';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { feedbackSuccess, feedbackWarning } from '@/feedback';
import { colors, radius, spacing } from '@/theme';

/**
 * Écran Arrivée : réception des bagages à l'escale de destination.
 *
 * L'agent scanne chaque bagage sorti de la soute. La cible est le nombre de
 * bagages réellement partis : 100 chargés au départ = 100 à scanner ici. Le
 * compteur affiche l'écart en continu, donc les manquants se voient sans
 * attendre la fin du déchargement.
 */
export default function Arrivee() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const [last, setLast] = useState<ArrivalScanResult | null>(null);
  // Échec technique (session, réseau, serveur) : le bagage n'a pas été traité.
  const [failure, setFailure] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);
  const pad = useSafePadding();

  async function onScan(tag: string) {
    if (!flightId) return;
    scanSeq.current += 1;
    try {
      const res = await scanArrivee(tag, flightId, profile?.id);
      setFailure(null);
      setLast(res);
      if (res.status === 'accepted') {
        setScanState('success');
        feedbackSuccess();
      } else {
        setScanState('error');
        feedbackWarning();
      }
    } catch (e) {
      // Le scan n'a pas abouti : rien n'a été écrit, ce bagage reste à scanner.
      setLast(null);
      setFailure((e as Error).message);
      setScanState('error');
      feedbackWarning();
    }
  }

  const accepted = last?.status === 'accepted' ? last : null;
  const complete = accepted?.complete ?? false;
  const missing = accepted ? Math.max(accepted.expected - accepted.arrived, 0) : 0;

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
          <View style={[styles.modePill, { borderColor: colors.success }]}>
            <Text style={[styles.modeText, { color: colors.success }]}>ARRIVÉE</Text>
          </View>
        </GlassCard>

        {/* Progression : reçus / partis en soute, et manquants restants */}
        {accepted ? (
          <GlassCard contentStyle={styles.progressCard}>
            <Ionicons
              name={complete ? 'checkmark-circle' : 'download'}
              size={22}
              color={complete ? colors.success : colors.primary}
            />
            <Text style={styles.progressText}>
              <Text style={[styles.progressNum, complete && { color: colors.success }]}>{accepted.arrived}</Text>
              <Text style={styles.progressSep}> / {accepted.expected} </Text>
              bagages reçus
              {complete ? '' : ` · ${missing} manquant${missing > 1 ? 's' : ''}`}
            </Text>
          </GlassCard>
        ) : null}

        <GlassCard strong rounded={radius.xl} contentStyle={styles.stage}>
          <ScanLottie state={scanState} replayKey={scanSeq.current} size={210} />
          <Text style={styles.stageTitle}>
            {scanState === 'success'
              ? complete
                ? 'Réception complète'
                : 'Bagage reçu'
              : scanState === 'error'
                ? failure
                  ? 'Scan non enregistré'
                  : 'Refusé'
                : 'Réception à destination'}
          </Text>
          <Text style={styles.stageHint}>
            {scanState === 'scanning'
              ? 'Scannez chaque bagage sorti de la soute'
              : failure
                ? 'Rescannez cette étiquette'
                : 'Prêt pour le prochain scan'}
          </Text>
        </GlassCard>

        {failure ? (
          <View style={[styles.result, styles.resultWarn]}>
            <Text style={styles.resultBadge}>SCAN NON ABOUTI</Text>
            <Text style={styles.resultReason}>Bagage non traité</Text>
            <Text style={styles.resultDetail}>{failure}</Text>
          </View>
        ) : last ? (
          accepted ? (
            <GlassCard
              strong
              contentStyle={[
                styles.result,
                { borderLeftWidth: 4, borderLeftColor: complete ? colors.success : colors.primary },
              ]}
            >
              <Text style={styles.resultName}>{accepted.passengerName}</Text>
              <Text style={styles.resultTag}>{accepted.tagNumber}</Text>
              <Text style={[styles.resultMsg, { color: complete ? colors.success : colors.primary }]}>
                {accepted.message}
              </Text>
            </GlassCard>
          ) : (
            <View style={[styles.result, styles.resultWarn]}>
              <Text style={styles.resultBadge}>REFUSÉ</Text>
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

  progressCard: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), padding: spacing(2) },
  progressText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  progressNum: { fontSize: 20, fontWeight: '900', color: colors.primary },
  progressSep: { fontSize: 16, fontWeight: '800', color: colors.muted },

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
  resultDetail: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing(0.5), fontWeight: '600' },
});
