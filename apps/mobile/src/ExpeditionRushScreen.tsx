import { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { ExpeditionRushResult } from '@police/shared';
import { useFlights } from './flights-store';
import { expeditionRush } from './api';
import { HiddenScanner } from './HiddenScanner';
import { ScanLottie, type ScanState } from './ScanLottie';
import { ScreenBackground, GlassCard, useSafePadding } from './Glass';
import { feedbackSuccess, feedbackWarning } from './feedback';
import { colors, radius, spacing } from './theme';

/**
 * Écran Expédition rush : enregistre un bagage qui voyage SANS passager sur ce
 * vol (mention RUSH). Rien à voir avec le tapis Bagages, qui sert à la
 * réconciliation bagage ↔ passager.
 *
 * Le bagage porte deux étiquettes (l'originale + la RUSH imprimée au
 * réacheminement) : l'agent scanne les deux, dans n'importe quel ordre. Le
 * premier scan identifie (restant connu → on nomme le propriétaire), le second
 * lie les deux numéros et enregistre. Un bagage inconnu part en attente de
 * validation superviseur : le dolly le refusera tant que rien n'est tranché.
 */
export function ExpeditionRushScreen() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  // Première étiquette scannée, en attente de la seconde.
  const [firstTag, setFirstTag] = useState<string | null>(null);
  const [last, setLast] = useState<ExpeditionRushResult | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);
  const pad = useSafePadding();

  function reset() {
    setFirstTag(null);
    setLast(null);
    setScanState('scanning');
  }

  async function onScan(tag: string) {
    if (!flightId) return;
    scanSeq.current += 1;

    if (firstTag && tag === firstTag) {
      setLast({ status: 'rejected', message: "Même étiquette scannée deux fois. Scannez l'AUTRE étiquette du bagage." });
      setScanState('error');
      feedbackWarning();
      return;
    }

    try {
      const res = firstTag
        ? await expeditionRush(firstTag, flightId, tag)
        : await expeditionRush(tag, flightId);
      setLast(res);
      if (res.status === 'lookup') {
        setFirstTag(tag);
        setScanState('scanning');
        feedbackSuccess();
      } else if (res.status === 'accepted') {
        setFirstTag(null);
        setScanState('success');
        feedbackSuccess();
      } else {
        setFirstTag(null);
        setScanState('error');
        feedbackWarning();
      }
    } catch (e) {
      setFirstTag(null);
      setLast({ status: 'rejected', message: (e as Error).message });
      setScanState('error');
      feedbackWarning();
    }
  }

  /**
   * Le bagage ne porte qu'une étiquette (cas fréquent : Air Congo colle une
   * RUSH sur un colis venu d'ailleurs). Enregistre avec la première seule.
   */
  async function onSoloTag() {
    if (!flightId || !firstTag) return;
    scanSeq.current += 1;
    try {
      const res = await expeditionRush(firstTag, flightId, undefined, true);
      setLast(res);
      setFirstTag(null);
      if (res.status === 'accepted') {
        setScanState('success');
        feedbackSuccess();
      } else {
        setScanState('error');
        feedbackWarning();
      }
    } catch (e) {
      setFirstTag(null);
      setLast({ status: 'rejected', message: (e as Error).message });
      setScanState('error');
      feedbackWarning();
    }
  }

  const waitingSecond = firstTag !== null && last?.status === 'lookup';

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
          <View style={[styles.modePill, { borderColor: colors.primary }]}>
            <Text style={[styles.modeText, { color: colors.primary }]}>EXPÉDITION RUSH</Text>
          </View>
        </GlassCard>

        <GlassCard strong rounded={radius.xl} contentStyle={styles.stage}>
          <ScanLottie state={scanState} replayKey={scanSeq.current} size={210} />
          <Text style={styles.stageTitle}>
            {scanState === 'success'
              ? 'Bagage enregistré'
              : scanState === 'error'
                ? 'Refusé'
                : waitingSecond
                  ? 'Étiquette 2 / 2'
                  : 'Bagage sans passager'}
          </Text>
          <Text style={styles.stageHint}>
            {waitingSecond
              ? "Scannez l'autre étiquette du bagage (originale ou RUSH)"
              : scanState === 'scanning'
                ? 'Scannez une des deux étiquettes du bagage'
                : 'Prêt pour le prochain bagage'}
          </Text>
        </GlassCard>

        {last ? (
          last.status === 'lookup' ? (
            <GlassCard strong contentStyle={[styles.result, { borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
              {last.known && last.passengerName ? (
                <Text style={styles.resultName}>{last.passengerName}</Text>
              ) : null}
              <Text style={[styles.resultMsg, { color: colors.text }]}>{last.message}</Text>
              <Pressable style={styles.soloBtn} onPress={onSoloTag}>
                <Text style={styles.soloText}>Ce bagage n&apos;a qu&apos;une étiquette</Text>
              </Pressable>
              <Pressable style={styles.resetBtn} onPress={reset}>
                <Text style={styles.resetText}>Recommencer</Text>
              </Pressable>
            </GlassCard>
          ) : last.status === 'accepted' ? (
            <GlassCard
              strong
              contentStyle={[
                styles.result,
                { borderLeftWidth: 4, borderLeftColor: last.validation === 'approved' ? colors.success : colors.warning },
              ]}
            >
              {last.passengerName ? <Text style={styles.resultName}>{last.passengerName}</Text> : null}
              <Text style={styles.resultTag}>
                {last.tagNumber} · RUSH {last.rushTagNumber}
              </Text>
              <Text
                style={[
                  styles.resultMsg,
                  { color: last.validation === 'approved' ? colors.success : colors.warning },
                ]}
              >
                {last.message}
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
  soloBtn: { marginTop: spacing(1.5), paddingHorizontal: spacing(2), paddingVertical: spacing(0.75), borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.primary },
  soloText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  resetBtn: { marginTop: spacing(1), paddingHorizontal: spacing(2), paddingVertical: spacing(0.75), borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  resetText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
});
