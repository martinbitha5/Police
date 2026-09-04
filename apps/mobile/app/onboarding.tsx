import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Suitcase } from 'phosphor-react-native';
import { useAuth } from '@/auth';
import { markOnboarded } from '@/settings';
import { BottomBar, Button, IconBubble, Screen, Text, useTheme } from '@/ui';

/**
 * Accueil, vu une seule fois.
 *
 * Un titre, une phrase qui dit ce que fait l'application, une illustration
 * sobre et un seul bouton. Rien d'autre : l'agent n'a rien à décider ici.
 */
export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();

  async function start() {
    await markOnboarded();
    router.replace(session ? '/flights' : '/login');
  }

  return (
    <Screen>
      <View
        style={[
          styles.body,
          { paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing['3xl'] },
        ]}
      >
        <Text variant="display">Police Bagage</Text>
        <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.md }}>
          Scannez les cartes d'embarquement et les étiquettes, et contrôlez chaque bagage avant
          qu'il parte en soute.
        </Text>

        {/* L'illustration occupe l'espace restant, centrée : elle n'a pas à
            pousser le bouton, la barre du bas est ancrée. */}
        <View style={styles.hero}>
          <IconBubble size={96} tone="neutral">
            <Suitcase size={42} color={theme.colors.text} weight="fill" />
          </IconBubble>
        </View>
      </View>

      <BottomBar>
        <Button label="Commencer" onPress={() => void start()} fullWidth size="lg" />
      </BottomBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
