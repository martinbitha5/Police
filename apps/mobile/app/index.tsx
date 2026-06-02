import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '@/auth';
import { ScreenBackground } from '@/Glass';
import { getOnboarded } from '@/settings';
import { colors } from '@/theme';

export default function Index() {
  const { session, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    getOnboarded().then(setOnboarded);
  }, []);

  if (loading || onboarded === null) {
    return (
      <View style={styles.center}>
        <ScreenBackground />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!onboarded) return <Redirect href="/onboarding" />;

  return <Redirect href={session ? '/flights' : '/login'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
