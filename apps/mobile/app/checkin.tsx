import { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanBoarding, type BoardingScanResponse } from '@/api';
import { HiddenScanner } from '@/HiddenScanner';
import { ScanLottie, type ScanState } from '@/ScanLottie';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { feedbackSuccess, feedbackWarning } from '@/feedback';
import { colors, radius, spacing } from '@/theme';

export default function CheckIn() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight, statsFor } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const count = flightId ? statsFor(flightId).pax : 0;
  const [last, setLast] = useState<BoardingScanResponse['passenger'] | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);
  const pad = useSafePadding();

  async function onScan(raw: string) {
    if (!flightId) return;
    scanSeq.current += 1;
    try {
      const res = await scanBoarding(raw, flightId, profile?.id);
      setLast(res.passenger);
      setMessage(null);
      setScanState('success');
      feedbackSuccess();
    } catch (e) {
      setMessage({ text: (e as Error).message, ok: false });
      setScanState('error');
      feedbackWarning();
    }
  }

  const routeText = last
    ? last.legs.map((l) => l.origin).concat(last.legs.at(-1)?.destination ?? '').join('  →  ')
    : '';

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
        <HiddenScanner onScan={onScan} />

        {/* En-tête vol */}
        <GlassCard strong contentStyle={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.flight}>{flight?.flight_number ?? '—'}</Text>
              <Text style={styles.route}>
                {flight ? `${flight.origin}  →  ${flight.destination}` : 'Chargement…'}
              </Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countNum}>{count}</Text>
              <Text style={styles.countLabel}>passagers</Text>
            </View>
          </View>

          {/* Instruction : seul ce vol est accepté au check-in. */}
          <View style={styles.instruction}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={styles.instructionText}>
              Seuls les boarding pass du vol {flight?.flight_number ?? 'sélectionné'} sont acceptés. Un autre vol est
              refusé.
            </Text>
          </View>
        </GlassCard>

        {/* Scène de scan animée */}
        <GlassCard strong rounded={radius.xl} contentStyle={styles.stage}>
          <ScanLottie state={scanState} replayKey={scanSeq.current} size={210} />
          <Text style={styles.stageTitle}>
            {scanState === 'success'
              ? 'Passager enregistré'
              : scanState === 'error'
                ? 'Scan refusé'
                : 'Scannez un boarding pass'}
          </Text>
          <Text style={styles.stageHint}>
            {scanState === 'scanning' ? 'En attente de lecture…' : 'Prêt pour le prochain scan'}
          </Text>
        </GlassCard>

        {message ? (
          message.text.includes('Mauvais vol') ? (
            <View style={styles.wrongFlightBanner}>
              <Ionicons name="airplane" size={22} color={colors.danger} />
              <View style={styles.wrongFlightTexts}>
                <Text style={styles.wrongFlightTitle}>MAUVAIS VOL</Text>
                <Text style={styles.wrongFlightText}>{message.text.replace('⚠️ ', '')}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️  {message.text}</Text>
            </View>
          )
        ) : null}

        {last ? (
          <GlassCard strong contentStyle={styles.lastCard}>
            <View style={styles.lastTopRow}>
              <Text style={styles.lastLabel}>DERNIER SCAN</Text>
              <View style={styles.okBadge}>
                <Text style={styles.okBadgeText}>✓ OK</Text>
              </View>
            </View>
            <Text style={styles.lastName}>{last.fullName}</Text>
            <View style={styles.metaRow}>
              <Meta label="Siège" value={last.seat || '—'} />
              <Meta label="Classe" value={last.class || '—'} />
              <Meta label="Bagages" value={String(last.declaredBaggageCount)} />
            </View>
            {routeText ? <Text style={styles.lastRoute}>{routeText}</Text> : null}
          </GlassCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing(2), gap: spacing(2) },
  header: { padding: spacing(2.5) },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    marginTop: spacing(1.5),
    paddingTop: spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  instructionText: { flex: 1, color: colors.muted, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  wrongFlightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.dangerBg,
    borderRadius: radius.lg,
    padding: spacing(2),
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  wrongFlightTexts: { flex: 1 },
  wrongFlightTitle: { color: colors.danger, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  wrongFlightText: { color: colors.danger, fontWeight: '700', fontSize: 14, marginTop: 2 },
  stage: {
    paddingVertical: spacing(3),
    alignItems: 'center',
  },
  stageTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: spacing(1) },
  stageHint: { color: colors.muted, fontSize: 14, marginTop: 2 },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing(2),
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorBannerText: { color: colors.danger, fontWeight: '700', textAlign: 'center' },
  lastCard: {
    padding: spacing(2.5),
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  lastTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  okBadge: { backgroundColor: colors.successBg, borderRadius: radius.pill, paddingHorizontal: spacing(1.25), paddingVertical: 2 },
  okBadgeText: { color: colors.success, fontWeight: '800', fontSize: 12 },
  lastName: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing(1) },
  metaRow: { flexDirection: 'row', gap: spacing(1.5), marginTop: spacing(1.5) },
  metaItem: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing(1),
    alignItems: 'center',
  },
  metaLabel: { color: colors.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  metaValue: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 2 },
  lastRoute: { color: colors.primary, fontWeight: '700', fontSize: 15, marginTop: spacing(1.5), textAlign: 'center' },
});
