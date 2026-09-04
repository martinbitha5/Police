import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { DollyScanResult } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanDolly } from '@/api';
import { HiddenScanner } from '@/HiddenScanner';
import { feedbackSuccess, feedbackWarning } from '@/feedback';
import {
  FlightHeader,
  Header,
  Row,
  ScanResult,
  ScanStage,
  Screen,
  ScreenScroll,
  Surface,
  Text,
  useTheme,
  type ScanState,
} from '@/ui';

/** Écran Dolly : contrôle rayon X, seuls les bagages enregistrés montent sur le dolly. */
export default function Dolly() {
  const theme = useTheme();
  const router = useRouter();
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const [last, setLast] = useState<DollyScanResult | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);

  async function onScan(tag: string) {
    if (!flightId) return;
    scanSeq.current += 1;
    try {
      const res = await scanDolly(tag, flightId, profile?.id);
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

  const accepted = last?.status === 'accepted' ? last : null;
  const complete = accepted?.complete ?? false;

  return (
    <Screen>
      <Header title="Dolly" onBack={() => router.back()} />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        <HiddenScanner onScan={onScan} />

        <FlightHeader
          flightNumber={flight?.flight_number ?? ''}
          origin={flight?.origin ?? ''}
          destination={flight?.destination ?? ''}
          mode="Dolly"
          note="Seuls les bagages enregistrés montent sur le dolly. Un bagage inconnu est refusé."
        />

        {/* Progression : bagages sur le dolly / bagages enregistrés du vol */}
        {accepted ? (
          <Surface elevation={0} bordered padding="base">
            <Row gap="md">
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Sur le dolly</Text>
                <Text variant="caption" color="textSecondary">
                  {complete ? 'Tous les bagages enregistrés sont chargés' : 'Bagages enregistrés du vol'}
                </Text>
              </View>
              <Text variant="priceLarge" tabular color={complete ? 'success' : 'text'}>
                {accepted.onDolly} / {accepted.confirmed}
              </Text>
            </Row>
          </Surface>
        ) : null}

        <ScanStage
          state={scanState}
          replayKey={scanSeq.current}
          title={
            scanState === 'success'
              ? complete
                ? 'Dolly complet'
                : 'Bagage sur le dolly'
              : scanState === 'error'
                ? 'Refusé'
                : 'Contrôle rayon X'
          }
          hint={
            scanState === 'scanning'
              ? 'Scannez chaque bagage sortant du rayon X'
              : 'Prêt pour le prochain scan'
          }
        />

        {last ? (
          accepted ? (
            <ScanResult
              tone={complete ? 'success' : 'info'}
              badgeLabel={complete ? 'Complet' : 'Accepté'}
              title={accepted.passengerName}
              subtitle={accepted.tagNumber}
              meta={[{ label: 'Sur le dolly', value: `${accepted.onDolly} / ${accepted.confirmed}` }]}
              message={accepted.message}
            />
          ) : (
            <ScanResult tone="danger" title="Scan refusé" message={last.message} />
          )
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}
