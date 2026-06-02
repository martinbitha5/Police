import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/auth';
import { ScreenBackground } from '@/Glass';
import { markOnboarded } from '@/settings';
import { colors, radius, spacing, shadow } from '@/theme';

export default function Onboarding() {
  const router = useRouter();
  const { session } = useAuth();

  async function start() {
    await markOnboarded();
    router.replace(session ? '/flights' : '/login');
  }

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <View style={styles.hero}>
        <LottieView
          source={require('../assets/lottie/onboarding.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      <View style={styles.texts}>
        <Text style={styles.brand}>Police Bagage</Text>
        <Text style={styles.title}>Scannez. Vérifiez. Protégez.</Text>
        <Text style={styles.subtitle}>
          Contrôle des boarding pass et des étiquettes bagage en temps réel, directement sur le terrain.
        </Text>
      </View>

      <Pressable style={({ pressed }) => [styles.button, shadow(2), pressed && styles.buttonPressed]} onPress={start}>
        <Text style={styles.buttonText}>Commencer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(3), justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lottie: { width: 280, height: 280 },
  texts: { alignItems: 'center', gap: spacing(1) },
  brand: { color: colors.primary, fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 16, textAlign: 'center', lineHeight: 24, marginTop: spacing(0.5) },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing(2.25),
    alignItems: 'center',
    marginTop: spacing(3),
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: colors.onPrimary, fontSize: 18, fontWeight: '800' },
});
