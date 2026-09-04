import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowsLeftRight } from 'phosphor-react-native';
import type { BaggageActionResult, SoutePosition } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { scanSoute } from '@/api';
import { HiddenScanner } from '@/HiddenScanner';
import { feedbackSuccess, feedbackWarning } from '@/feedback';
import {
  Button,
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

const SOUTE_LABEL: Record<SoutePosition, string> = {
  avant: 'Soute avant',
  arriere: 'Soute arrière',
};

/** Écran Soute : identifie dans quel compartiment (avant ou arrière) chaque bagage est chargé. */
export default function Soute() {
  const theme = useTheme();
  const router = useRouter();
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;

  const [mode, setMode] = useState<SoutePosition | null>(null);
  const [last, setLast] = useState<BaggageActionResult | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);

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

  const flightHeader = (
    <FlightHeader
      flightNumber={flight?.flight_number ?? ''}
      origin={flight?.origin ?? ''}
      destination={flight?.destination ?? ''}
      mode={mode ? SOUTE_LABEL[mode] : 'Soute'}
      note={
        mode
          ? `Chaque bagage scanné est placé en ${SOUTE_LABEL[mode].toLowerCase()}.`
          : 'Choisissez le compartiment avant de scanner.'
      }
    />
  );

  // Étape 1 : choix du compartiment. Aucun scanner monté tant qu'il n'est pas choisi.
  if (!mode) {
    return (
      <Screen>
        <Header title="Soute" onBack={() => router.back()} />
        <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
          {flightHeader}

          <Text variant="h3">Compartiment</Text>
          <View style={[styles.chips, { gap: theme.spacing.sm }]}>
            <Button label="Soute avant" variant="secondary" onPress={() => selectMode('avant')} />
            <Button label="Soute arrière" variant="secondary" onPress={() => selectMode('arriere')} />
          </View>
        </ScreenScroll>
      </Screen>
    );
  }

  // Étape 2 : scanner, compartiment choisi.
  const accepted = last?.status === 'accepted' ? last : null;

  return (
    <Screen>
      <Header title="Soute" onBack={() => router.back()} />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        <HiddenScanner onScan={onScan} />

        {flightHeader}

        {/* Sélection active en primaire, l'autre compartiment en secondaire. */}
        <View style={[styles.chips, { gap: theme.spacing.sm }]}>
          <Button
            label="Soute avant"
            variant={mode === 'avant' ? 'primary' : 'secondary'}
            onPress={mode === 'avant' ? undefined : () => selectMode('avant')}
          />
          <Button
            label="Soute arrière"
            variant={mode === 'arriere' ? 'primary' : 'secondary'}
            onPress={mode === 'arriere' ? undefined : () => selectMode('arriere')}
          />
        </View>

        <ScanStage
          state={scanState}
          replayKey={scanSeq.current}
          title={
            scanState === 'success'
              ? 'Bagage placé'
              : scanState === 'error'
                ? 'Refusé'
                : SOUTE_LABEL[mode]
          }
          hint={scanState === 'scanning' ? "Scannez l'étiquette bagage" : 'Prêt pour le prochain scan'}
        />

        {last ? (
          accepted ? (
            <ScanResult
              tone="success"
              title={accepted.passengerName}
              subtitle={accepted.tagNumber}
              meta={[
                { label: 'Compartiment', value: SOUTE_LABEL[mode] },
                { label: 'Chargés', value: `${accepted.count} / ${accepted.declaredCount}` },
              ]}
              message={accepted.message}
            />
          ) : (
            <ScanResult tone="danger" title="Scan refusé" message={last.message} />
          )
        ) : null}

        <Button
          label="Changer de compartiment"
          variant="ghost"
          size="sm"
          icon={<ArrowsLeftRight size={theme.iconSize.xs} color={theme.colors.text} />}
          onPress={backToSelect}
          style={{ alignSelf: 'center' }}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
