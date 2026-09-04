import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Package } from 'phosphor-react-native';
import type { BaggageLoadAllResult } from '@police/shared';
import { useAuth } from '@/auth';
import { useFlights } from '@/flights-store';
import { loadAllBaggage } from '@/api';
import { feedbackSuccess, feedbackWarning } from '@/feedback';
import {
  BottomBar,
  Button,
  FlightHeader,
  Header,
  IconBubble,
  ScanResult,
  Screen,
  ScreenScroll,
  Text,
  useTheme,
} from '@/ui';

/**
 * Écran Charger : pousse en soute, d'un seul geste, tous les bagages
 * enregistrés non rush du vol. Pas de scan ici, une seule action.
 */
export default function Charger() {
  const theme = useTheme();
  const router = useRouter();
  const { flightId } = useLocalSearchParams<{ flightId: string }>();
  const { profile } = useAuth();
  const { getFlight } = useFlights();
  const flight = flightId ? getFlight(flightId) : undefined;
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BaggageLoadAllResult | null>(null);

  async function onLoad() {
    if (!flightId || busy) return;
    setBusy(true);
    try {
      const res = await loadAllBaggage(flightId, profile?.id);
      setResult(res);
      if (res.status === 'accepted') feedbackSuccess();
      else feedbackWarning();
    } catch (e) {
      setResult({ status: 'rejected', message: (e as Error).message });
      feedbackWarning();
    } finally {
      setBusy(false);
    }
  }

  const accepted = result?.status === 'accepted' ? result : null;
  const loadedLabel = accepted
    ? `${accepted.loaded} bagage${accepted.loaded > 1 ? 's' : ''} chargé${accepted.loaded > 1 ? 's' : ''} en soute`
    : '';

  return (
    <Screen>
      <Header title="Charger" onBack={() => router.back()} />
      <ScreenScroll contentContainerStyle={{ gap: theme.spacing.base }}>
        <FlightHeader
          flightNumber={flight?.flight_number ?? ''}
          origin={flight?.origin ?? ''}
          destination={flight?.destination ?? ''}
          mode="Charger"
          note="Scannez d'abord les bagages rush (restants). Ensuite, chargez en soute d'un seul geste tous les bagages enregistrés restants."
        />

        {/* Scène : pas de scanner, une action groupée. */}
        <View
          style={[
            styles.stage,
            {
              backgroundColor: theme.colors.surfaceSunken,
              borderRadius: theme.radius.md,
              paddingVertical: theme.spacing['2xl'],
              paddingHorizontal: theme.spacing.xl,
            },
          ]}
        >
          <IconBubble size={96} tone={accepted ? 'success' : 'neutral'}>
            <Package
              size={42}
              color={accepted ? theme.colors.success : theme.colors.text}
              weight={accepted ? 'fill' : 'regular'}
            />
          </IconBubble>
          <Text variant="h2" align="center" style={{ marginTop: theme.spacing.lg }}>
            Charger en soute
          </Text>
          <Text variant="body" color="textSecondary" align="center" style={{ marginTop: theme.spacing.xs }}>
            Tous les bagages enregistrés non rush
          </Text>
        </View>

        {result ? (
          accepted ? (
            <ScanResult
              tone="success"
              badgeLabel="Chargé"
              title={loadedLabel}
              meta={[
                { label: 'Déjà chargés', value: String(accepted.alreadyLoaded) },
                { label: 'Rush exclus', value: String(accepted.rushed) },
                { label: 'Enregistrés', value: String(accepted.confirmed) },
              ]}
              message={accepted.message}
            />
          ) : (
            <ScanResult tone="danger" title="Chargement refusé" message={result.message} />
          )
        ) : null}
      </ScreenScroll>

      <BottomBar>
        <Button
          label="Charger les bagages"
          onPress={() => void onLoad()}
          loading={busy}
          disabled={busy}
          fullWidth
          size="lg"
        />
      </BottomBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center' },
});
