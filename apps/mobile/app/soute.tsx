import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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

  const accepted = last?.status === 'accepted';
  const modeColor = mode === 'avant' ? colors.primary : mode === 'arriere' ? colors.accent : colors.muted;
  const modeLabel = mode === 'avant' ? 'SOUTE AVANT' : mode === 'arriere' ? 'SOUTE ARRIÈRE' : null;

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
        {mode ? <HiddenScanner onScan={onScan} /> : null}

        {/* En-tête vol + pill mode */}
        <GlassCard strong contentStyle={styles.header}>
          <View>
            <Text style={styles.flight}>{flight?.flight_number ?? '—'}</Text>
            <Text style={styles.route}>
              {flight ? `${flight.origin}  →  ${flight.destination}` : 'Chargement…'}
            </Text>
          </View>
          {modeLabel ? (
            <View style={[styles.modePill, { borderColor: modeColor }]}>
              <Text style={[styles.modeText, { color: modeColor }]}>{modeLabel}</Text>
            </View>
          ) : null}
        </GlassCard>

        {/* Sélecteur de compartiment */}
        <GlassCard strong contentStyle={styles.selector}>
          <Text style={styles.selectorLabel}>Choisir le compartiment</Text>
          <View style={styles.selectorRow}>
            <ModeButton
              label="Soute avant"
              active={mode === 'avant'}
              color={colors.primary}
              onPress={() => selectMode('avant')}
            />
            <ModeButton
              label="Soute arrière"
              active={mode === 'arriere'}
              color={colors.accent}
              onPress={() => selectMode('arriere')}
            />
          </View>
        </GlassCard>

        {/* Zone scan */}
        <GlassCard strong rounded={radius.xl} contentStyle={styles.stage}>
          <ScanLottie state={mode ? scanState : 'scanning'} replayKey={scanSeq.current} size={200} />
          <Text style={styles.stageTitle}>
            {!mode
              ? 'Sélectionnez un compartiment'
              : scanState === 'success'
              ? 'Bagage placé'
              : scanState === 'error'
              ? 'Refusé'
              : `Scan — ${mode === 'avant' ? 'soute avant' : 'soute arrière'}`}
          </Text>
          <Text style={styles.stageHint}>
            {!mode
              ? 'Appuyez sur Soute avant ou Soute arrière ci-dessus'
              : scanState === 'scanning'
              ? 'Scannez l\'étiquette du bagage'
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
      </ScrollView>
    </View>
  );
}

function ModeButton({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.modeBtn, active && { ...styles.modeBtnActive, borderColor: color, backgroundColor: `${color}22` }, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <Text style={[styles.modeBtnText, active && { color }]}>{label}</Text>
    </Pressable>
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
  selector: { padding: spacing(2), gap: spacing(1.5) },
  selectorLabel: { color: colors.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  selectorRow: { flexDirection: 'row', gap: spacing(1.5) },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing(1.75),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeBtnActive: { borderWidth: 2 },
  modeBtnText: { color: colors.muted, fontSize: 15, fontWeight: '800' },
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
