import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth';
import { supabase } from '@/supabase';
import {
  BottomBar,
  Button,
  Header,
  InlineAlert,
  Input,
  Screen,
  ScreenScroll,
  Spacer,
  Text,
  useTheme,
} from '@/ui';

const MIN_PASSWORD = 6;

export default function ProfileEdit() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, session, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const email = session?.user.email ?? 'Non renseigné';

  async function onSave() {
    setError(null);

    const name = fullName.trim();
    if (!name) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    if (password && password.length < MIN_PASSWORD) {
      setError(`Le mot de passe doit faire au moins ${MIN_PASSWORD} caractères.`);
      return;
    }
    if (password && password !== password2) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSaving(true);
    try {
      // 1. Nom complet → table profiles (soumis à la RLS profiles_self_update).
      if (name !== profile?.full_name) {
        const { data, error: upErr } = await supabase
          .from('profiles')
          .update({ full_name: name })
          .eq('id', session?.user.id ?? '')
          .select('id');
        if (upErr) throw new Error(upErr.message);
        // RLS bloquée silencieusement : aucune ligne renvoyée → on prévient.
        if (!data || data.length === 0) {
          throw new Error(
            "Modification refusée par le serveur. La policy d'édition du profil n'est peut-être pas encore appliquée.",
          );
        }
      }

      // 2. Mot de passe → auth (hors table profiles, pas de RLS).
      if (password) {
        const { error: pwErr } = await supabase.auth.updateUser({ password });
        if (pwErr) throw new Error(pwErr.message);
      }

      await refreshProfile();
      setDone(true);
      setPassword('');
      setPassword2('');
      setTimeout(() => router.back(), 700);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Header title="Modifier le profil" onBack={() => router.back()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenScroll>
          {/* Identité */}
          <Text variant="label" color="textMuted" uppercase>
            Identité
          </Text>
          <Spacer size="sm" />

          <Input
            label="Nom complet"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nom complet"
            autoCapitalize="words"
            editable={!saving}
          />

          <Spacer size="base" />

          <Input
            label="Email"
            value={email}
            editable={false}
            helper="L'email est géré par l'administrateur."
          />

          <Spacer size="xl" />

          {/* Mot de passe */}
          <Text variant="label" color="textMuted" uppercase>
            Mot de passe
          </Text>
          <Spacer size="sm" />

          <Input
            label="Nouveau mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="Laisser vide pour ne pas changer"
            isPassword
            autoCapitalize="none"
            editable={!saving}
          />

          <Spacer size="base" />

          <Input
            label="Confirmer"
            value={password2}
            onChangeText={setPassword2}
            placeholder="Confirmer le mot de passe"
            isPassword
            autoCapitalize="none"
            editable={!saving}
          />

          {error ? (
            <InlineAlert tone="danger" message={error} style={{ marginTop: theme.spacing.base }} />
          ) : null}
          {done ? (
            <InlineAlert
              tone="success"
              message="Profil mis à jour."
              style={{ marginTop: theme.spacing.base }}
            />
          ) : null}
        </ScreenScroll>

        <BottomBar>
          <Button
            label="Enregistrer"
            onPress={() => void onSave()}
            loading={saving}
            fullWidth
            size="lg"
          />
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
