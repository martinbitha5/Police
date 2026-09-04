import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FLIGHT_LOCK_REASON, isFlightLocked } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanBoarding, type BoardingScanResponse } from '@/api';
import { HiddenScanner } from '@/HiddenScanner';
import { feedbackSuccess, feedbackWarning } from '@/feedback';
import {
  FlightHeader,
  Header,
  InlineAlert,
  LockedStage,
  ScanResult,
  ScanStage,
  Screen,
  ScreenScroll,
  Text,
  useTheme,
  type ScanState,
} from '@/ui';

/**
 * Préfixe d'avertissement (pictogramme U+26A0 et son sélecteur de variante
 * U+FE0F) que l'API met parfois devant ses messages. Construit à partir des
 * points de code pour ne pas embarquer d'emoji dans la source.
 */
const WARNING_SIGN = String.fromCodePoint(0x26a0);
const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);
const WARNING_PREFIX = new RegExp(`^${WARNING_SIGN}${VARIATION_SELECTOR}?\\s*`);

export default function CheckIn() {
  const theme = useTheme();
  const router = useRouter();
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight, statsFor, refreshStatsFor } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const count = flightId ? statsFor(flightId).pax : 0;
  const [last, setLast] = useState<BoardingScanResponse['passenger'] | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);
  const isLocked = flight ? isFlightLocked(flight.status) : false;
  const lockReason = `${(flight && FLIGHT_LOCK_REASON[flight.status]) ?? 'Vol verrouillé'}. Les scans de boarding pass sont désactivés.`;

  async function onScan(raw: string) {
    if (!flightId) return;
    scanSeq.current += 1;
    try {
      const res = await scanBoarding(raw, flightId, profile?.id);
      setLast(res.passenger);
      setMessage(null);
      setScanState('success');
      feedbackSuccess();
      void refreshStatsFor(flightId);
    } catch (e) {
      setMessage({ text: (e as Error).message, ok: false });
      setScanState('error');
      feedbackWarning();
    }
  }

  const routeText = last
    ? last.legs.map((l) => l.origin).concat(last.legs.at(-1)?.destination ?? '').join(' · ')
    : '';

  const errorText = message ? message.text.replace(WARNING_PREFIX, '') : '';
  const wrongFlight = Boolean(message && message.text.includes('Mauvais vol'));

  return (
    <Screen>
      <Header title="Check-in" onBack={() => router.back()} />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        {!isLocked ? <HiddenScanner onScan={onScan} /> : null}

        <FlightHeader
          flightNumber={flight?.flight_number ?? ''}
          origin={flight?.origin ?? ''}
          destination={flight?.destination ?? ''}
          mode="Check-in"
          right={
            <View style={styles.counter}>
              <Text variant="priceLarge" tabular>
                {count}
              </Text>
              <Text variant="caption" color="textSecondary">
                passagers
              </Text>
            </View>
          }
          note={`Seuls les boarding pass du vol ${flight?.flight_number ?? 'sélectionné'} sont acceptés. Un autre vol est refusé.`}
        />

        {isLocked ? (
          <LockedStage title="Check-in fermé" reason={lockReason} />
        ) : (
          <>
            <ScanStage
              state={scanState}
              replayKey={scanSeq.current}
              title={
                scanState === 'success'
                  ? 'Passager enregistré'
                  : scanState === 'error'
                    ? 'Scan refusé'
                    : 'Scannez un boarding pass'
              }
              hint={scanState === 'scanning' ? 'En attente de lecture' : 'Prêt pour le prochain scan'}
            />

            {message ? (
              wrongFlight ? (
                <ScanResult tone="danger" title="Mauvais vol" message={errorText} />
              ) : (
                <InlineAlert tone="danger" message={errorText} />
              )
            ) : null}

            {last ? (
              <ScanResult
                tone="success"
                title={last.fullName}
                subtitle={last.pnr || undefined}
                meta={[
                  { label: 'Siège', value: last.seat || '-' },
                  { label: 'Classe', value: last.class || '-' },
                  { label: 'Bagages', value: String(last.declaredBaggageCount) },
                ]}
                message={routeText || undefined}
              />
            ) : null}
          </>
        )}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: { alignItems: 'flex-end' },
});
