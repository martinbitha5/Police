import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth';
import { supabase } from '@/supabase';
import { ScreenBackground, GlassCard, useSafePadding } from '@/Glass';
import { colors, radius, spacing } from '@/theme';

const INPUT_BG = 'rgba(255,255,255,0.7)';
const MIN_PASSWORD = 6;

export default function ProfileEdit() {
  const router = useRouter();
  const pad = useSafePadding();
  const { profile, session, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const email = session?.user.email ?? '—';

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
    <View style={styles.root}>
      <ScreenBackground />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>

          <Text style={styles.title}>Modifier le profil</Text>

          {/* Identité */}
          <Text style={styles.sectionTitle}>Identité</Text>
          <GlassCard contentStyle={styles.card}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nom complet"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              editable={!saving}
            />

            <Text style={[styles.label, styles.labelSpaced]}>Email</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputDisabledText}>{email}</Text>
            </View>
            <Text style={styles.hint}>L'email est géré par l'administrateur.</Text>
          </GlassCard>

          {/* Mot de passe */}
          <Text style={styles.sectionTitle}>Mot de passe</Text>
          <GlassCard contentStyle={styles.card}>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Laisser vide pour ne pas changer"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoCapitalize="none"
              editable={!saving}
            />

            <Text style={[styles.label, styles.labelSpaced]}>Confirmer</Text>
            <TextInput
              style={styles.input}
              value={password2}
              onChangeText={setPassword2}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoCapitalize="none"
              editable={!saving}
            />
          </GlassCard>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {done ? <Text style={styles.success}>Profil mis à jour ✓</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.save, (pressed || saving) && styles.savePressed]}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={colors.onPrimary} />
                <Text style={styles.saveText}>Enregistrer</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing(2), gap: spacing(1.5) },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: spacing(0.5) },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginLeft: spacing(0.5), marginBottom: spacing(0.5) },
  sectionTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing(1),
    marginLeft: spacing(0.5),
  },
  card: { padding: spacing(2.5) },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: spacing(0.75) },
  labelSpaced: { marginTop: spacing(2) },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.5),
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputDisabled: { justifyContent: 'center', opacity: 0.6 },
  inputDisabledText: { fontSize: 16, fontWeight: '600', color: colors.muted },
  hint: { color: colors.muted, fontSize: 12, marginTop: spacing(0.75), fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: spacing(1) },
  success: { color: colors.success, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: spacing(1) },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing(2),
    marginTop: spacing(2),
  },
  savePressed: { opacity: 0.8 },
  saveText: { color: colors.onPrimary, fontWeight: '800', fontSize: 16 },
});
