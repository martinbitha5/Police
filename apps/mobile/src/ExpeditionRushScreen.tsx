import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ExpeditionRushResult } from '@police/shared';
import { useFlights } from './flights-store';
import { expeditionRush } from './api';
import { HiddenScanner } from './HiddenScanner';
import { feedbackSuccess, feedbackWarning } from './feedback';
import {
  BottomBar,
  Button,
  FlightHeader,
  Header,
  Mono,
  ScanResult,
  ScanStage,
  Screen,
  ScreenScroll,
  Surface,
  Text,
  useTheme,
  type ScanState,
} from './ui';

/**
 * Écran Expédition rush : enregistre un bagage qui voyage SANS passager sur ce
 * vol (mention RUSH). Rien à voir avec le tapis Bagages, qui sert à la
 * réconciliation bagage / passager.
 *
 * Le bagage porte deux étiquettes (l'originale + la RUSH imprimée au
 * réacheminement) : l'agent scanne les deux, dans n'importe quel ordre. Le
 * premier scan identifie (restant connu, on nomme le propriétaire), le second
 * lie les deux numéros et enregistre. Un bagage inconnu part en attente de
 * validation superviseur : le dolly le refusera tant que rien n'est tranché.
 */
export function ExpeditionRushScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  // Première étiquette scannée, en attente de la seconde.
  const [firstTag, setFirstTag] = useState<string | null>(null);
  const [last, setLast] = useState<ExpeditionRushResult | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const scanSeq = useRef(0);

  function reset() {
    setFirstTag(null);
    setLast(null);
    setScanState('scanning');
  }

  async function onScan(tag: string) {
    if (!flightId) return;
    scanSeq.current += 1;

    if (firstTag && tag === firstTag) {
      setLast({ status: 'rejected', message: "Même étiquette scannée deux fois. Scannez l'autre étiquette du bagage." });
      setScanState('error');
      feedbackWarning();
      return;
    }

    try {
      const res = firstTag
        ? await expeditionRush(firstTag, flightId, tag)
        : await expeditionRush(tag, flightId);
      setLast(res);
      if (res.status === 'lookup') {
        setFirstTag(tag);
        setScanState('scanning');
        feedbackSuccess();
      } else if (res.status === 'accepted') {
        setFirstTag(null);
        setScanState('success');
        feedbackSuccess();
      } else {
        setFirstTag(null);
        setScanState('error');
        feedbackWarning();
      }
    } catch (e) {
      setFirstTag(null);
      setLast({ status: 'rejected', message: (e as Error).message });
      setScanState('error');
      feedbackWarning();
    }
  }

  /**
   * Le bagage ne porte qu'une étiquette (cas fréquent : Air Congo colle une
   * RUSH sur un colis venu d'ailleurs). Enregistre avec la première seule.
   */
  async function onSoloTag() {
    if (!flightId || !firstTag) return;
    scanSeq.current += 1;
    try {
      const res = await expeditionRush(firstTag, flightId, undefined, true);
      setLast(res);
      setFirstTag(null);
      if (res.status === 'accepted') {
        setScanState('success');
        feedbackSuccess();
      } else {
        setScanState('error');
        feedbackWarning();
      }
    } catch (e) {
      setFirstTag(null);
      setLast({ status: 'rejected', message: (e as Error).message });
      setScanState('error');
      feedbackWarning();
    }
  }

  const waitingSecond = firstTag !== null && last?.status === 'lookup';
  const accepted = last?.status === 'accepted' ? last : null;
  const lookup = last?.status === 'lookup' ? last : null;

  // Étape courante : 1 avant tout scan, 2 en attente de la seconde étiquette,
  // 3 quand le bagage est enregistré et attend le superviseur.
  const currentStep = accepted ? (accepted.validation === 'approved' ? 4 : 3) : waitingSecond ? 2 : 1;

  return (
    <Screen>
      <Header title="Expédition rush" onBack={() => router.back()} />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        <HiddenScanner onScan={onScan} />

        <FlightHeader
          flightNumber={flight?.flight_number ?? ''}
          origin={flight?.origin ?? ''}
          destination={flight?.destination ?? ''}
          mode="Expédition rush"
          note="Bagage voyageant sans passager. Scannez ses deux étiquettes, l'originale et la rush, dans n'importe quel ordre."
        />

        <Surface elevation={0} bordered padding="base">
          <Step index={1} current={currentStep} label="Première étiquette" detail={firstTag ?? undefined} />
          <Step index={2} current={currentStep} label="Seconde étiquette" />
          <Step index={3} current={currentStep} label="Validation superviseur" last />
        </Surface>

        <ScanStage
          state={scanState}
          replayKey={scanSeq.current}
          title={
            scanState === 'success'
              ? 'Bagage enregistré'
              : scanState === 'error'
                ? 'Refusé'
                : waitingSecond
                  ? 'Étiquette 2 sur 2'
                  : 'Bagage sans passager'
          }
          hint={
            waitingSecond
              ? "Scannez l'autre étiquette du bagage, originale ou rush"
              : scanState === 'scanning'
                ? 'Scannez une des deux étiquettes du bagage'
                : 'Prêt pour le prochain bagage'
          }
        />

        {last ? (
          lookup ? (
            <ScanResult
              tone="info"
              badgeLabel="En attente"
              title={lookup.known && lookup.passengerName ? lookup.passengerName : 'Première étiquette lue'}
              subtitle={firstTag ?? undefined}
              meta={lookup.originFlight ? [{ label: "Vol d'origine", value: lookup.originFlight }] : undefined}
              message={lookup.message}
            />
          ) : accepted ? (
            <ScanResult
              tone={accepted.validation === 'approved' ? 'success' : 'warning'}
              badgeLabel={accepted.validation === 'approved' ? 'Validé' : 'À valider'}
              title={accepted.passengerName ?? 'Bagage sans passager'}
              meta={[
                { label: 'Étiquette', value: accepted.tagNumber },
                { label: 'Rush', value: accepted.rushTagNumber },
                ...(accepted.originFlight ? [{ label: "Vol d'origine", value: accepted.originFlight }] : []),
              ]}
              message={accepted.message}
            />
          ) : (
            <ScanResult tone="danger" title="Scan refusé" message={last.message} />
          )
        ) : null}
      </ScreenScroll>

      {/* Actions disponibles seulement entre les deux scans. Aucune n'est
          primaire : la suite attendue est un scan, pas un tap. */}
      {waitingSecond ? (
        <BottomBar style={{ gap: theme.spacing.sm }}>
          <Button
            label="Ce bagage n'a qu'une étiquette"
            variant="secondary"
            onPress={() => void onSoloTag()}
            fullWidth
            size="lg"
          />
          <Button label="Recommencer" variant="ghost" onPress={reset} fullWidth />
        </BottomBar>
      ) : null}
    </Screen>
  );
}

/**
 * Ligne d'étape numérotée : disque plein noir, numéro inversé, quand l'étape
 * est faite ; bordé quand elle est à venir ; libellé renforcé pour l'étape
 * courante.
 */
function Step({
  index,
  current,
  label,
  detail,
  last = false,
}: {
  index: number;
  current: number;
  label: string;
  detail?: string;
  last?: boolean;
}) {
  const theme = useTheme();
  const done = index < current;
  const active = index === current;

  return (
    <View
      style={[
        styles.step,
        {
          gap: theme.spacing.md,
          paddingBottom: last ? 0 : theme.spacing.md,
          marginBottom: last ? 0 : theme.spacing.md,
          borderBottomWidth: last ? 0 : theme.borderWidth.hairline,
          borderBottomColor: theme.colors.divider,
        },
      ]}
    >
      <View
        style={[
          styles.disc,
          {
            borderRadius: theme.radius.pill,
            backgroundColor: done ? theme.colors.text : 'transparent',
            borderWidth: done ? 0 : theme.borderWidth.thin,
            borderColor: active ? theme.colors.text : theme.colors.borderStrong,
          },
        ]}
      >
        <Text variant="overline" tabular color={done ? 'textInverse' : active ? 'text' : 'textMuted'}>
          {index}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text variant={active ? 'bodyStrong' : 'body'} color={done || active ? 'text' : 'textSecondary'}>
          {label}
        </Text>
        {detail ? (
          <Mono variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
            {detail}
          </Mono>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center' },
  disc: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});
