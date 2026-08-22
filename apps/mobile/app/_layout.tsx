import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/auth';
import { FlightsProvider } from '@/flights-store';
import { GlassBar } from '@/Glass';
import { loadSettings } from '@/settings';
import { colors } from '@/theme';

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
  useEffect(() => {
    void loadSettings();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FlightsProvider>
          <AuthGate />
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerTransparent: true,
              headerBackground: () => <GlassBar />,
              headerTintColor: colors.primary,
              headerTitleStyle: { fontWeight: '800', color: colors.text },
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Écrans de travail : pas d'en-tête fixe — retour par balayage / bouton système. */}
            <Stack.Screen name="flight" options={{ headerShown: false }} />
            <Stack.Screen name="checkin" options={{ headerShown: false }} />
            <Stack.Screen name="baggage" options={{ headerShown: false }} />
            <Stack.Screen name="embarquement" options={{ headerShown: false }} />
            <Stack.Screen name="dolly" options={{ headerShown: false }} />
            <Stack.Screen name="charger" options={{ headerShown: false }} />
            <Stack.Screen name="rush" options={{ headerShown: false }} />
            <Stack.Screen name="expedition-rush" options={{ headerShown: false }} />
            <Stack.Screen name="soute" options={{ headerShown: false }} />
            <Stack.Screen name="arrivee" options={{ headerShown: false }} />
            <Stack.Screen name="company" options={{ headerShown: false }} />
            <Stack.Screen name="contact" options={{ headerShown: false }} />
            <Stack.Screen name="legal" options={{ headerShown: false }} />
            <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
          </Stack>
        </FlightsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
