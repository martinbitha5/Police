import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FLIGHT_LOCK_REASON, isFlightLocked, type BoardingGateAccepted } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanEmbarquement } from '@/api';
import { HiddenScanner } from '@/HiddenScanner';
import { feedbackSuccess, feedbackWarning } from '@/feedback';
import {
  FlightHeader,
  Header,
  InlineAlert,
  LockedStage,
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
 * Préfixe d'avertissement (pictogramme U+26A0 et son sélecteur de variante
 * U+FE0F) que l'API met parfois devant ses messages. Construit à partir des
 * points de code pour ne pas embarquer d'emoji dans la source.
 */
const WARNING_SIGN = String.fromCodePoint(0x26a0);
const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);
const WARNING_PREFIX = new RegExp(`^${WARNING_SIGN}${VARIATION_SELECTOR}?\\s*`);

export default function Embarquement() {
  const theme = useTheme();
  const router = useRouter();
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight, statsFor } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const stats = flightId ? statsFor(flightId) : { pax: 0, boarded: 0 };
  const [last, setLast] = useState<BoardingGateAccepted | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);
  const isLocked = flight ? isFlightLocked(flight.status) : false;
  const lockReason = `${(flight && FLIGHT_LOCK_REASON[flight.status]) ?? 'Vol verrouillé'}. Les scans d'embarquement sont désactivés.`;

  async function onScan(raw: string) {
    if (!flightId) return;
    scanSeq.current += 1;
    try {
      const res = await scanEmbarquement(raw, flightId, profile?.id);
      if (res.status === 'accepted') {
        setLast(res);
        setMessage(null);
        setScanState('success');
        feedbackSuccess();
      } else {
        setMessage({ text: res.message, ok: false });
        setScanState('error');
        feedbackWarning();
      }
    } catch (e) {
      setMessage({ text: (e as Error).message, ok: false });
      setScanState('error');
      feedbackWarning();
    }
  }

  // Compteur affiché : préférer les chiffres frais du dernier scan, sinon le cache.
  const boarded = last?.counts.boarded ?? stats.boarded;
  const registered = last?.counts.registered ?? stats.pax;
  const remaining = last?.counts.remaining ?? Math.max(registered - boarded, 0);

  const errorText = message ? message.text.replace(WARNING_PREFIX, '') : '';
  const wrongFlight = Boolean(message && message.text.includes('Mauvais vol'));

  return (
    <Screen>
      <Header title="Embarquement" onBack={() => router.back()} />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        {!isLocked ? <HiddenScanner onScan={onScan} /> : null}

        <FlightHeader
          flightNumber={flight?.flight_number ?? ''}
          origin={flight?.origin ?? ''}
          destination={flight?.destination ?? ''}
          mode="Embarquement"
          right={
            <View style={styles.counter}>
              <Text variant="priceLarge" tabular>
                {boarded}
              </Text>
              <Text variant="caption" color="textSecondary">
                embarqués
              </Text>
            </View>
          }
        />

        {/* Où en est la porte : les enregistrés et ce qui reste à faire monter. */}
        <Surface elevation={0} bordered padding="base">
          <Row>
            <Counter label="Enregistrés" value={String(registered)} />
            <Counter label="Reste à embarquer" value={String(remaining)} />
          </Row>
        </Surface>

        {isLocked ? (
          <LockedStage title="Embarquement fermé" reason={lockReason} />
        ) : (
          <>
            <ScanStage
              state={scanState}
              replayKey={scanSeq.current}
              title={
                scanState === 'success'
                  ? last?.alreadyBoarded
                    ? 'Déjà embarqué'
                    : 'Passager embarqué'
                  : scanState === 'error'
                    ? 'Embarquement refusé'
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
                badgeLabel={last.alreadyBoarded ? 'Déjà embarqué' : 'Embarqué'}
                title={last.passengerName}
                meta={[
                  { label: 'Siège', value: last.seat || '-' },
                  { label: 'Embarqués', value: `${last.counts.boarded} / ${last.counts.registered}` },
                  { label: 'Reste', value: String(last.counts.remaining) },
                ]}
              />
            ) : null}
          </>
        )}
      </ScreenScroll>
    </Screen>
  );
}

/** Compteur : chiffre tabulaire au-dessus de son libellé. */
function Counter({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="priceLarge" tabular>
        {value}
      </Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: { alignItems: 'flex-end' },
  stat: { flex: 1, alignItems: 'center' },
});
