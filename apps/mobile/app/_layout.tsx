import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/auth';
import { FlightsProvider } from '@/flights-store';
import { loadSettings } from '@/settings';
import { FONT_ASSETS, ToastProvider, useTheme } from '@/ui';

/** Renvoie vers le login dès que la session disparaît (déconnexion globale). */
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const top = segments[0];
    const inPublic = top === 'login' || top === 'onboarding' || top === undefined;
    if (!session && !inPublic) router.replace('/login');
  }, [session, loading, segments, router]);

  return null;
}

export default function RootLayout() {
  const theme = useTheme();
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  useEffect(() => {
    void loadSettings();
  }, []);

  // Rien tant que les polices ne sont pas prêtes : un premier rendu en police
  // système suivi d'un remplacement ferait sauter tout l'écran.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <FlightsProvider>
            <AuthGate />
            <StatusBar style="dark" />
            {/* Chaque écran rend son propre `Header` : aucun en-tête natif. */}
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
                animation: 'slide_from_right',
              }}
            >
              {/* Les écrans d'entrée se remplacent en fondu ; les écrans de
                  travail glissent depuis la droite, car on y entre par un
                  geste et on en revient. */}
              <Stack.Screen name="index" options={{ animation: 'fade' }} />
              <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
              <Stack.Screen name="login" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            </Stack>
          </FlightsProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
