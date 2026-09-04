import { useRef, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View, type TextInput } from 'react-native';
import { Redirect } from 'expo-router';
import { Envelope, LockKey, Suitcase } from 'phosphor-react-native';
import { useAuth } from '@/auth';
import {
  Button,
  IconBubble,
  InlineAlert,
  Input,
  Screen,
  ScreenScroll,
  Spacer,
  Text,
  useTheme,
} from '@/ui';

// Format email standard : présence d'un nom, d'un @, d'un domaine et d'une extension.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const EMAIL_INVALID = 'Adresse email invalide (ex. agent@aeroport.com).';

export default function Login() {
  const theme = useTheme();
  const { session, signIn } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  if (session) return <Redirect href="/flights" />;

  const trimmedEmail = email.trim();
  const emailValid = EMAIL_RE.test(trimmedEmail);
  const canSubmit = trimmedEmail.length > 0 && password.length > 0 && !busy;
  // Erreur affichée dès que le champ contient une saisie non conforme (hors focus).
  const showEmailInvalid =
    emailError !== null || (trimmedEmail.length > 0 && !emailValid && focused !== 'email');

  /** Vérifie le format quand on quitte le champ email. */
  function validateEmailOnBlur() {
    setFocused(null);
    if (trimmedEmail.length > 0 && !emailValid) {
      setEmailError(EMAIL_INVALID);
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
      setEmailError(EMAIL_INVALID);
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
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScreenScroll
          contentContainerStyle={styles.scroll}
          keyboardDismissMode="interactive"
        >
          {/* Marque */}
          <View style={styles.brand}>
            <IconBubble size={80} tone="neutral">
              <Suitcase size={36} color={theme.colors.text} weight="fill" />
            </IconBubble>
            <Text variant="h1" style={{ marginTop: theme.spacing.base }}>
              Police Bagage
            </Text>
            <Text variant="caption" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
              Contrôle bagage, aéroport
            </Text>
          </View>

          <Spacer size="2xl" />

          <Input
            label="Email"
            placeholder="agent@aeroport.com"
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
            error={showEmailInvalid ? (emailError ?? EMAIL_INVALID) : null}
            icon={<Envelope size={theme.iconSize.sm} color={theme.colors.textMuted} />}
          />

          <Spacer size="base" />

          <Input
            ref={passwordRef}
            label="Mot de passe"
            placeholder="Mot de passe"
            isPassword
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
            icon={<LockKey size={theme.iconSize.sm} color={theme.colors.textMuted} />}
          />

          {error ? (
            <InlineAlert tone="danger" message={error} style={{ marginTop: theme.spacing.base }} />
          ) : null}

          <Spacer size="xl" />

          <Button
            label="Se connecter"
            onPress={() => void onSubmit()}
            disabled={!canSubmit}
            loading={busy}
            fullWidth
            size="lg"
          />

          <Spacer size="xl" />

          <Text variant="caption" color="textMuted" align="center">
            Accès réservé au personnel autorisé.
          </Text>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  brand: { alignItems: 'center' },
});
