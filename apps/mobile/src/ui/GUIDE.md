# Design system mobile, registre Uber

Tout écran importe ses briques depuis `@/ui` et rien d'autre pour le visuel :

```tsx
import {
  Screen, ScreenScroll, Header, BottomBar, SectionHeader, Row,
  Text, Mono, Button, Pressable, Surface, Divider, Spacer,
  Badge, CountBadge, IconBubble, Input, ListRow, Avatar,
  Skeleton, ListSkeleton, EmptyState, ErrorState, InlineAlert, OfflineBanner,
  FloatingTabBar, useTabBarPadding, ToastProvider, useToast,
  FlightHeader, ScanStage, ScanResult, LockedStage, ScanIndicator,
  useTheme, FONT_ASSETS,
} from '@/ui';
```

Interdits dans un écran : `Text` de react-native, `Ionicons`, `@expo/vector-icons`, `GlassCard`,
`ScreenBackground`, `GlassBar`, `@/Glass`, `@/theme` (ancien thème), `expo-blur`,
`expo-linear-gradient`, `lottie-react-native`, couleur ou taille de police codée en dur,
emoji, tiret long « — » dans un libellé, libellé en MAJUSCULES décoratives.

## Les règles qui font le rendu

- Noir et blanc pour la structure. Un seul accent, le bleu `theme.colors.accent`, réservé aux
  liens, aux états actifs et au `CountBadge`. Les sémantiques (success, warning, danger) ne
  servent qu'à signaler un statut, jamais à décorer.
- Le bouton primaire est noir. Un seul `variant="primary"` par écran. Les autres actions
  prennent `secondary` (aplat gris) ou `ghost`.
- Rayon 8 partout (`theme.radius.md`), pilule (`theme.radius.pill`) pour les boutons auto-dimensionnés
  et les chips. Rien d'autre.
- Filets et aplats gris plutôt que des ombres. `Surface elevation={0} bordered` est la carte par
  défaut. Les seules ombres : la barre d'onglets et le toast.
- Icônes Phosphor (`phosphor-react-native`), `weight="regular"` au repos, `fill` pour l'état actif ou
  un statut, `duotone` pour les états vides. Tailles via `theme.iconSize.xs|sm|md|lg|xl`.
- Chiffres tabulaires (`tabular`) sur tout ce qui change en place : compteurs, heures, numéros.
- Espacements via `theme.spacing.*` (4 pt : xxs 2, xs 4, sm 8, md 12, base 16, lg 20, xl 24,
  2xl 32, 3xl 40). Marge d'écran : `theme.screenPadding` (16).
- Texte : vouvoiement, impératif, phrases courtes, pas de point d'exclamation. Un état vide
  décrit un fait (« Aucun vol aujourd'hui. »).
- Un écran de données implémente loading (Skeleton à sa place), empty, error, success.

## Variantes de texte

`display` 40 · `h1` 28 · `h2` 24 · `h3` 18 · `body` 16 · `bodyStrong` 16 · `bodySmall` 14 ·
`label` 14 · `labelStrong` 14 · `caption` 12 · `overline` 12 · `price` / `priceLarge` /
`priceSmall` (compteurs) · `button` · `buttonSmall`. `Mono` pour un numéro d'étiquette ou un PNR.

Couleurs de texte : `text`, `textSecondary`, `textMuted`, `textInverse`, `primary`, `accent`,
`success`, `warning`, `danger`, `info`, `onSuccessSoft`, `onWarningSoft`, `onDangerSoft`, `onInfoSoft`.

Tons (`Badge`, `ScanResult`, `IconBubble`) : `neutral`, `info`, `warning`, `success`, `danger`.

## Écran de liste

```tsx
export default function Flights() {
  const theme = useTheme();
  const tabBarPadding = useTabBarPadding();
  const { flights, loading } = useFlights();

  return (
    <Screen>
      <Header title="Vols" large right={<CountBadge count={2} />} />
      <FlatList
        data={flights}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ paddingHorizontal: theme.screenPadding, paddingBottom: tabBarPadding, gap: theme.spacing.md }}
        ListEmptyComponent={loading ? <ListSkeleton count={3} /> : <EmptyState title="Aucun vol aujourd'hui" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/flight', params: { flightId: item.id } })}>
            <Surface elevation={0} bordered padding="base">
              <Row>
                <Text variant="h2" tabular>{item.flight_number}</Text>
                <Badge label="Embarquement" tone="success" dot />
              </Row>
              <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
                {item.origin} vers {item.destination}
              </Text>
              <Divider spacing="md" />
              <Row>
                <Text variant="label" color="textSecondary">47 passagers</Text>
                <CaretRight size={theme.iconSize.sm} color={theme.colors.textMuted} />
              </Row>
            </Surface>
          </Pressable>
        )}
      />
    </Screen>
  );
}
```

## Écran de scan

```tsx
export default function Dolly() {
  const theme = useTheme();
  const router = useRouter();
  // ... même logique métier qu'avant, inchangée : HiddenScanner, api, feedback, état.

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
          note="Scannez chaque bagage sortant du rayon X."
        />
        <ScanStage
          state={scanState}
          replayKey={scanSeq.current}
          title={scanState === 'success' ? 'Bagage sur le dolly' : scanState === 'error' ? 'Refusé' : 'Contrôle rayon X'}
          hint={scanState === 'scanning' ? 'En attente de lecture' : 'Prêt pour le prochain scan'}
        />
        {last ? (
          <ScanResult
            tone={accepted ? 'success' : 'danger'}
            title={accepted ? accepted.passengerName : 'Scan refusé'}
            subtitle={accepted?.tagNumber}
            meta={[{ label: 'Sur le dolly', value: `${accepted.onDolly} / ${accepted.confirmed}` }]}
            message={last.message}
          />
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}
```

`FlightHeader` : `flightNumber`, `origin`, `destination`, `mode?` (badge neutre, casse normale),
`right?` (compteur), `note?` (instruction sous un filet).
`ScanStage` : `state`, `replayKey?`, `title`, `hint?`, `size?` (64 par défaut). Une rangée
compacte, indicateur à gauche, textes à droite : elle ne doit jamais redevenir un grand bloc.
`ScanResult` : `tone`, `title`, `subtitle?` (Mono par défaut, `mono={false}` pour une route),
`meta?: {label, value}[]`, `message?`, `badgeLabel?`.
`LockedStage` : `title`, `reason`.

## Autres briques

- `Header` : `title`, `subtitle`, `onBack`, `right`, `large` (h1). Un écran racine d'onglet
  n'a pas de retour ; un écran empilé en a un.
- `Button` : `label`, `onPress`, `variant`, `size` (sm 40, md 48, lg 56), `fullWidth`, `loading`,
  `disabled`, `icon`, `iconRight`, `trailing`.
- `Input` : `label`, `error`, `helper`, `icon`, `isPassword`, plus les props de TextInput.
- `ListRow` : `title`, `subtitle`, `icon`, `right`, `onPress`, `destructive`. À empiler dans une
  `Surface elevation={0} bordered padding="none"` avec `paddingHorizontal: theme.spacing.base`
  et un `Divider` entre chaque ligne.
- `InlineAlert` : `message`, `tone`, `actionLabel`, `onAction`. Remplace tous les bandeaux faits main.
- `Badge` : `label`, `tone`, `variant` (soft/solid), `dot`, `size`.
- `IconBubble` : `size`, `tone`, enfant icône (44 % du diamètre).
- `Gauge` : `value`, `total`, `label`, `size?` (96). Anneau gris et arc accent : la part de `value`
  dans `total`, chiffre au centre, « sur N » dessous. Trois par rangée au plus.
- `FloatingTabBar` : `items: { key, label, icon({color, focused, size}), focused, onPress }[]`.
  Les listes réservent `useTabBarPadding()` en bas.
- `ToastProvider` à la racine, `useToast().success|error|info(message)` dans les écrans.
