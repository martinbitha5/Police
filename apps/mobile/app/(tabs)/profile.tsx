import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { UserRole } from '@police/shared';
import { useAuth } from '@/auth';
import { ScreenBackground, GlassCard, useContentPadding } from '@/Glass';
import { colors, radius, spacing, shadow } from '@/theme';

const ROLE_LABEL: Record<UserRole, string> = {
  agent: 'Agent terrain',
  supervisor: 'Superviseur',
  admin: 'Administrateur',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(ts: string | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function Profile() {
  const { profile, session, signOut } = useAuth();
  const router = useRouter();
  const name = profile?.full_name ?? 'Agent';
  const email = session?.user.email ?? '—';
  const pad = useContentPadding(true);

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, pad]}>
        {/* En-tête identité */}
        <GlassCard strong rounded={radius.xl} contentStyle={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          {profile ? (
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={styles.roleText}>{ROLE_LABEL[profile.role]}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
            onPress={() => router.push('/profile-edit')}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editText}>Modifier</Text>
          </Pressable>
        </GlassCard>

        {/* Informations */}
        <GlassCard contentStyle={styles.card}>
          <Row icon="mail" label="Email" value={email} />
          <Divider />
          <Row icon="location" label="Gate assignée" value={profile?.gate ?? 'Non assignée'} />
          <Divider />
          <Row icon="calendar" label="Membre depuis" value={formatDate(profile?.created_at)} />
        </GlassCard>

        <Pressable style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowTexts}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing(2), gap: spacing(2) },
  hero: { padding: spacing(3), alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1.5),
    ...shadow(2),
  },
  avatarText: { color: colors.onPrimary, fontSize: 32, fontWeight: '800' },
  name: { color: colors.text, fontSize: 22, fontWeight: '800' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.5),
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radius.pill,
    marginTop: spacing(1),
  },
  roleText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.5),
    marginTop: spacing(2),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editBtnPressed: { opacity: 0.6 },
  editText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  card: { paddingHorizontal: spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), paddingVertical: spacing(2) },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTexts: { flex: 1 },
  rowLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  rowValue: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
    backgroundColor: colors.dangerBg,
    borderRadius: radius.lg,
    padding: spacing(2),
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  logoutPressed: { opacity: 0.7 },
  logoutText: { color: colors.danger, fontWeight: '800', fontSize: 16 },
});
