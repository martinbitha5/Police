import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { BaggageActionResult } from '@police/shared';
import { useAuth } from './auth';
import { useFlights } from './flights-store';
import { rushBaggage } from './api';
import { HiddenScanner } from './HiddenScanner';
import { feedbackSuccess, feedbackWarning } from './feedback';
import {
  FlightHeader,
  Header,
  ScanResult,
  ScanStage,
  Screen,
  ScreenScroll,
  useTheme,
  type ScanState,
} from './ui';

/**
 * Écran Restants : scan des bagages de CE vol qui restent au sol, à réacheminer
 * sur un vol suivant. (L'entrée d'un bagage sans passager sur un vol se fait
 * dans l'écran Expédition rush, pas ici.)
 */
export function RushScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const [last, setLast] = useState<BaggageActionResult | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);

  async function onScan(tag: string) {
    if (!flightId) return;
    scanSeq.current += 1;
    try {
      const res = await rushBaggage(tag, flightId, profile?.id);
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

  return (
    <Screen>
      <Header title="Restants" onBack={() => router.back()} />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        <HiddenScanner onScan={onScan} />

        <FlightHeader
          flightNumber={flight?.flight_number ?? ''}
          origin={flight?.origin ?? ''}
          destination={flight?.destination ?? ''}
          mode="Restants"
          note="Scannez les bagages de ce vol restés au sol, à réacheminer sur un vol suivant."
        />

        <ScanStage
          state={scanState}
          replayKey={scanSeq.current}
          title={
            scanState === 'success'
              ? 'Marqué pour réacheminement'
              : scanState === 'error'
                ? 'Refusé'
                : 'Restants (à réacheminer)'
          }
          hint={
            scanState === 'scanning'
              ? 'Scannez les bagages restants à réacheminer'
              : 'Prêt pour le prochain scan'
          }
        />

        {last ? (
          last.status === 'accepted' ? (
            <ScanResult
              tone="warning"
              badgeLabel="À réacheminer"
              title={last.passengerName}
              subtitle={last.tagNumber}
              message={last.message}
            />
          ) : (
            <ScanResult tone="danger" title="Bagage refusé" message={last.message} />
          )
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}
