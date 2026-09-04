import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { BaggageScanResult } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanBaggage } from '@/api';
import { HiddenScanner } from '@/HiddenScanner';
import { feedbackSuccess, feedbackWarning, feedbackFraud } from '@/feedback';
import {
  FlightHeader,
  Header,
  ScanResult,
  ScanStage,
  Screen,
  ScreenScroll,
  Text,
  useTheme,
  type ScanState,
} from '@/ui';

export default function Baggage() {
  const theme = useTheme();
  const router = useRouter();
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight, statsFor } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const { bagOk, bagTotal } = flightId ? statsFor(flightId) : { bagOk: 0, bagTotal: 0 };
  const [last, setLast] = useState<BaggageScanResult | null>(null);
  // Étiquette du dernier scan, pour que l'agent la compare à l'étiquette
  // physique : la réponse de l'API ne la renvoie pas.
  const [lastTag, setLastTag] = useState<string | null>(null);
  // Échec technique (session, réseau, serveur) : distinct d'un rejet décidé par
  // l'anti-fraude. Ici le bagage n'a pas été traité du tout.
  const [failure, setFailure] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);

  async function onScan(tag: string) {
    if (!flightId) return;
    scanSeq.current += 1;
    try {
      const res = await scanBaggage(tag, flightId, profile?.gate ?? null, profile?.id);
      setFailure(null);
      setLast(res);
      setLastTag(tag);
      if (res.status === 'accepted') {
        setScanState('success');
        feedbackSuccess();
      } else {
        setScanState('error');
        if (res.fraudAlert) feedbackFraud();
        else feedbackWarning();
      }
    } catch (e) {
      // Le scan n'a pas abouti : aucune décision n'a été prise sur ce bagage et
      // rien n'a été écrit en base. On ne réutilise donc pas la carte de rejet,
      // qui laisserait croire que le système s'est prononcé. L'agent doit
      // rescanner l'étiquette.
      setLast(null);
      setLastTag(null);
      setFailure((e as Error).message);
      setScanState('error');
      feedbackWarning();
    }
  }

  const isFraud = last?.status === 'rejected' && last.fraudAlert;

  return (
    <Screen>
      <Header title="Bagages" onBack={() => router.back()} />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        <HiddenScanner onScan={onScan} />

        <FlightHeader
          flightNumber={flight?.flight_number ?? ''}
          origin={flight?.origin ?? ''}
          destination={flight?.destination ?? ''}
          mode="Bagages"
          right={
            <View style={styles.counter}>
              <Text variant="priceLarge" tabular>
                {bagOk} / {bagTotal}
              </Text>
              <Text variant="caption" color="textSecondary">
                bagages
              </Text>
            </View>
          }
        />

        <ScanStage
          state={scanState}
          replayKey={scanSeq.current}
          title={
            scanState === 'success'
              ? 'Bagage confirmé'
              : scanState === 'error'
                ? failure
                  ? 'Scan non enregistré'
                  : isFraud
                    ? 'Alerte fraude'
                    : 'Bagage refusé'
                : 'Scannez une étiquette'
          }
          hint={
            scanState === 'scanning'
              ? 'En attente de lecture'
              : failure
                ? 'Rescannez cette étiquette'
                : 'Prêt pour le prochain scan'
          }
        />

        {failure ? (
          <ScanResult
            tone="warning"
            badgeLabel="Scan non abouti"
            title="Bagage non traité"
            message={failure}
          />
        ) : last ? (
          last.status === 'accepted' ? (
            <ScanResult
              tone="success"
              title={last.passengerName}
              subtitle={lastTag ?? undefined}
              meta={[{ label: 'Bagages confirmés', value: `${last.confirmedCount} / ${last.declaredCount}` }]}
            />
          ) : (
            <ScanResult
              tone="danger"
              badgeLabel={isFraud ? 'Alerte fraude' : 'Refusé'}
              title="Bagage refusé"
              subtitle={last.reason}
              mono={false}
              message={last.message}
            />
          )
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: { alignItems: 'flex-end' },
});
