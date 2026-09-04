import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ArrivalScanResult } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanArrivee } from '@/api';
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

/**
 * Écran Arrivée : réception des bagages à l'escale de destination.
 *
 * L'agent scanne chaque bagage sorti de la soute. La cible est le nombre de
 * bagages réellement partis : 100 chargés au départ = 100 à scanner ici. Le
 * compteur affiche l'écart en continu, donc les manquants se voient sans
 * attendre la fin du déchargement.
 */
export default function Arrivee() {
  const theme = useTheme();
  const router = useRouter();
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const [last, setLast] = useState<ArrivalScanResult | null>(null);
  // Échec technique (session, réseau, serveur) : le bagage n'a pas été traité.
  const [failure, setFailure] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);

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
    <Screen>
      <Header title="Arrivée" onBack={() => router.back()} />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        <HiddenScanner onScan={onScan} />

        <FlightHeader
          flightNumber={flight?.flight_number ?? ''}
          origin={flight?.origin ?? ''}
          destination={flight?.destination ?? ''}
          mode="Arrivée"
          note="La cible est le nombre de bagages partis en soute. Les manquants s'affichent au fil du déchargement."
        />

        {/* Progression : reçus / partis en soute, et manquants restants */}
        {accepted ? (
          <Surface elevation={0} bordered padding="base">
            <Row gap="md">
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Bagages reçus</Text>
                <Text variant="caption" color={complete ? 'success' : 'textSecondary'} tabular>
                  {complete
                    ? 'Réception complète'
                    : `${missing} manquant${missing > 1 ? 's' : ''}`}
                </Text>
              </View>
              <Text variant="priceLarge" tabular color={complete ? 'success' : 'text'}>
                {accepted.arrived} / {accepted.expected}
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
                ? 'Réception complète'
                : 'Bagage reçu'
              : scanState === 'error'
                ? failure
                  ? 'Scan non enregistré'
                  : 'Refusé'
                : 'Réception à destination'
          }
          hint={
            scanState === 'scanning'
              ? 'Scannez chaque bagage sorti de la soute'
              : failure
                ? 'Rescannez cette étiquette'
                : 'Prêt pour le prochain scan'
          }
        />

        {failure ? (
          <ScanResult
            tone="warning"
            badgeLabel="Non abouti"
            title="Bagage non traité"
            message={failure}
          />
        ) : last ? (
          accepted ? (
            <ScanResult
              tone={complete ? 'success' : 'info'}
              badgeLabel={complete ? 'Complet' : 'Reçu'}
              title={accepted.passengerName}
              subtitle={accepted.tagNumber}
              meta={[{ label: 'Reçus', value: `${accepted.arrived} / ${accepted.expected}` }]}
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
