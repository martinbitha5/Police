import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  type TextInput as RNTextInput,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth';
import { ScreenBackground, GlassCard } from '@/Glass';
import { colors, radius, spacing, shadow } from '@/theme';

// Format email standard : présence d'un nom, d'un @, d'un domaine et d'une extension.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Login() {
  const { session, signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<RNTextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  if (session) return <Redirect href="/flights" />;

  const trimmedEmail = email.trim();
  const emailValid = EMAIL_RE.test(trimmedEmail);
  const canSubmit = trimmedEmail.length > 0 && password.length > 0 && !busy;
  // Bordure rouge dès que le champ contient une saisie non conforme (hors focus).
  const showEmailInvalid = emailError !== null || (trimmedEmail.length > 0 && !emailValid && focused !== 'email');

  /** Vérifie le format quand on quitte le champ email. */
  function validateEmailOnBlur() {
    setFocused(null);
    if (trimmedEmail.length > 0 && !emailValid) {
      setEmailError('Adresse email invalide (ex. agent@aeroport.com).');
    } else {
      setEmailError(null);
    }
  }

  async function onSubmit() {
    if (!trimmedEmail || !password) {
      setError('Veuillez saisir votre email et mot de passe.');
      return;
    }
    if (!emailValid) {
      setEmailError('Adresse email invalide (ex. agent@aeroport.com).');
      setError(null);
      return;
    }
    setEmailError(null);
    setBusy(true);
    setError(null);
    const { error } = await signIn(trimmedEmail, password);
    if (error) setError(error);
    setBusy(false);
  }

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing(4), paddingBottom: insets.bottom + spacing(4) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Marque */}
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Suitcase />
            </View>
            <Text style={styles.title}>Police Bagage</Text>
            <Text style={styles.tagline}>Contrôle bagage · Aéroport</Text>
          </View>

          {/* Carte de connexion */}
          <GlassCard strong rounded={radius.xl} contentStyle={styles.card}>
            <Text style={styles.cardTitle}>Connexion agent</Text>
            <Text style={styles.cardSubtitle}>Identifiez-vous pour démarrer votre service.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  focused === 'email' && styles.inputFocused,
                  showEmailInvalid && styles.inputError,
                ]}
                placeholder="agent@aeroport.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (emailError) setEmailError(null);
                }}
                onFocus={() => setFocused('email')}
                onBlur={validateEmailOnBlur}
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!busy}
              />
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.passwordRow, focused === 'password' && styles.inputFocused]}>
                <TextInput
                  ref={passwordRef}
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  returnKeyType="go"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={onSubmit}
                  editable={!busy}
                />
                <Pressable
                  hitSlop={10}
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.toggle}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <EyeIcon off={!showPassword} />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && styles.buttonPressed,
              ]}
              onPress={onSubmit}
              disabled={!canSubmit}
            >
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </Pressable>
          </GlassCard>

          <Text style={styles.footer}>Accès réservé au personnel autorisé.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Petite valise dessinée en Views (pas d'emoji). */
function Suitcase() {
  return (
    <View style={suitcase.wrap}>
      <View style={suitcase.handle} />
      <View style={suitcase.body}>
        <View style={suitcase.strap} />
      </View>
    </View>
  );
}

/** Icône œil dessinée en Views (afficher/masquer le mot de passe). */
function EyeIcon({ off }: { off: boolean }) {
  return (
    <View style={eye.box}>
      <View style={eye.lens}>
        <View style={eye.pupil} />
      </View>
      {off ? <View style={eye.slash} /> : null}
    </View>
  );
}

const eye = StyleSheet.create({
  box: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  lens: {
    width: 24,
    height: 15,
    borderWidth: 2,
    borderColor: colors.muted,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 6.5,
    height: 6.5,
    borderRadius: 4,
    backgroundColor: colors.muted,
  },
  slash: {
    position: 'absolute',
    width: 28,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.muted,
    transform: [{ rotate: '-45deg' }],
  },
});

const suitcase = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
  handle: {
    width: 20,
    height: 11,
    borderWidth: 3,
    borderColor: colors.onPrimary,
    borderBottomWidth: 0,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    marginBottom: -2,
  },
  body: {
    width: 36,
    height: 28,
    borderRadius: 7,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strap: {
    width: 6,
    height: 28,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing(3) },

  brand: { alignItems: 'center', marginBottom: spacing(4) },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(2),
    ...shadow(3),
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  tagline: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  card: { padding: spacing(3), gap: spacing(0.5) },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  cardSubtitle: { color: colors.muted, fontSize: 14, marginTop: 2, marginBottom: spacing(2) },

  field: { marginBottom: spacing(2) },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: spacing(0.75) },
  input: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing(1.75),
    paddingVertical: Platform.OS === 'ios' ? spacing(1.75) : spacing(1.25),
    fontSize: 16,
  },
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  fieldError: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing(0.75) },

  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingRight: spacing(1.5),
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: spacing(1.75),
    paddingVertical: Platform.OS === 'ios' ? spacing(1.75) : spacing(1.25),
    fontSize: 16,
  },
  toggle: { padding: spacing(0.5), alignItems: 'center', justifyContent: 'center' },

  errorBox: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing(1.25),
    paddingHorizontal: spacing(1.5),
    marginBottom: spacing(1),
  },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '600', textAlign: 'center' },

  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing(1),
    minHeight: 52,
    ...shadow(2),
  },
  buttonDisabled: { backgroundColor: colors.muted, opacity: 0.5, ...shadow(1) },
  buttonPressed: { backgroundColor: colors.primaryDark },
  buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  footer: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: spacing(3) },
});
