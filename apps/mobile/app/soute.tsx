import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BaggageActionResult, SoutePosition } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanSoute } from '@/api';
import { HiddenScanner } from '@/HiddenScanner';
import { ScanLottie, type ScanState } from '@/ScanLottie';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { feedbackSuccess, feedbackWarning } from '@/feedback';
import { colors, radius, spacing } from '@/theme';

export default function Soute() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;

  const [mode, setMode] = useState<SoutePosition | null>(null);
  const [last, setLast] = useState<BaggageActionResult | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);
  const pad = useSafePadding();

  async function onScan(tag: string) {
    if (!flightId || !mode) return;
    scanSeq.current += 1;
    try {
      const res = await scanSoute(tag, flightId, mode, profile?.id);
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

  function selectMode(m: SoutePosition) {
    setMode(m);
    setLast(null);
    setScanState('scanning');
  }

  function backToSelect() {
    setMode(null);
    setLast(null);
    setScanState('scanning');
  }

  const modeColor = mode === 'avant' ? colors.primary : colors.accent;
  const modeLabel = mode === 'avant' ? 'SOUTE AVANT' : 'SOUTE ARRIÈRE';

  // ── Étape 1 : choix du compartiment ─────────────────────────
  if (!mode) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
          {/* Carte vol */}
          <GlassCard strong contentStyle={styles.flightCard}>
            <Text style={styles.flightNumber}>{flight?.flight_number ?? '—'}</Text>
            <Text style={styles.flightRoute}>
              {flight ? `${flight.origin}  →  ${flight.destination}` : 'Chargement…'}
            </Text>
          </GlassCard>

          <Text style={styles.sectionTitle}>Choisir le compartiment</Text>

          {/* Soute avant */}
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
            onPress={() => selectMode('avant')}
          >
            <GlassCard contentStyle={styles.compartmentCard}>
              <View style={[styles.compartmentIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="layers" size={30} color={colors.onPrimary} />
              </View>
              <View style={styles.compartmentTexts}>
                <Text style={styles.compartmentTitle}>Soute avant</Text>
                <Text style={styles.compartmentSub}>Compartiment avant de l'avion</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.muted} />
            </GlassCard>
          </Pressable>

          {/* Soute arrière */}
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
            onPress={() => selectMode('arriere')}
          >
            <GlassCard contentStyle={styles.compartmentCard}>
              <View style={[styles.compartmentIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="layers-outline" size={30} color={colors.onPrimary} />
              </View>
              <View style={styles.compartmentTexts}>
                <Text style={styles.compartmentTitle}>Soute arrière</Text>
                <Text style={styles.compartmentSub}>Compartiment arrière de l'avion</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.muted} />
            </GlassCard>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Étape 2 : scanner (compartiment choisi) ──────────────────
  const accepted = last?.status === 'accepted';

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
        <HiddenScanner onScan={onScan} />

        {/* En-tête vol + pill mode */}
        <GlassCard strong contentStyle={styles.header}>
          <View>
            <Text style={styles.flightNumber}>{flight?.flight_number ?? '—'}</Text>
            <Text style={styles.flightRoute}>
              {flight ? `${flight.origin}  →  ${flight.destination}` : 'Chargement…'}
            </Text>
          </View>
          <View style={[styles.modePill, { borderColor: modeColor }]}>
            <Text style={[styles.modeText, { color: modeColor }]}>{modeLabel}</Text>
          </View>
        </GlassCard>

        {/* Zone scan */}
        <GlassCard strong rounded={radius.xl} contentStyle={styles.stage}>
          <ScanLottie state={scanState} replayKey={scanSeq.current} size={210} />
          <Text style={styles.stageTitle}>
            {scanState === 'success'
              ? 'Bagage placé'
              : scanState === 'error'
              ? 'Refusé'
              : mode === 'avant'
              ? 'Soute avant'
              : 'Soute arrière'}
          </Text>
          <Text style={styles.stageHint}>
            {scanState === 'scanning'
              ? 'Scannez l\'étiquette bagage'
              : 'Prêt pour le prochain scan'}
          </Text>
        </GlassCard>

        {/* Résultat dernier scan */}
        {last ? (
          accepted && last.status === 'accepted' ? (
            <GlassCard strong contentStyle={[styles.result, { borderLeftWidth: 4, borderLeftColor: modeColor }]}>
              <Text style={styles.resultName}>{last.passengerName}</Text>
              <Text style={styles.resultTag}>{last.tagNumber}</Text>
              <Text style={[styles.resultMsg, { color: modeColor }]}>{last.message}</Text>
            </GlassCard>
          ) : (
            <View style={[styles.result, styles.resultWarn]}>
              <Text style={styles.resultBadge}>REFUSÉ</Text>
              <Text style={styles.resultReason}>{last.message}</Text>
            </View>
          )
        ) : null}

        {/* Bouton changer de compartiment */}
        <Pressable
          style={({ pressed }) => [styles.changeBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={backToSelect}
        >
          <Ionicons name="swap-horizontal" size={16} color={colors.muted} />
          <Text style={styles.changeBtnText}>Changer de compartiment</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing(2), gap: spacing(2) },

  // Vol
  flightCard: { padding: spacing(2.5) },
  flightNumber: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  flightRoute: { color: colors.muted, fontSize: 15, marginTop: 2, fontWeight: '600' },

  // Sélection compartiment
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing(0.5),
    marginLeft: spacing(0.5),
  },
  compartmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(2),
    gap: spacing(2),
  },
  compartmentIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compartmentTexts: { flex: 1 },
  compartmentTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  compartmentSub: { color: colors.muted, fontSize: 14, marginTop: 2, fontWeight: '600' },

  // Scanner
  header: { padding: spacing(2.5), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modePill: { borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5) },
  modeText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  stage: { paddingVertical: spacing(3), alignItems: 'center' },
  stageTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: spacing(1), textAlign: 'center' },
  stageHint: { color: colors.muted, fontSize: 14, marginTop: 2, textAlign: 'center' },

  // Résultat
  result: { padding: spacing(2.5), alignItems: 'center' },
  resultWarn: { backgroundColor: colors.warningBg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.warningBorder },
  resultName: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  resultTag: { color: colors.muted, fontSize: 15, fontWeight: '700', marginTop: 2, fontFamily: 'monospace' },
  resultMsg: { fontSize: 16, fontWeight: '700', marginTop: spacing(1), textAlign: 'center' },
  resultBadge: { color: colors.warning, fontWeight: '900', fontSize: 14, letterSpacing: 1, marginBottom: spacing(0.5) },
  resultReason: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },

  // Changer compartiment
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(0.75),
    paddingVertical: spacing(1),
  },
  changeBtnText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
