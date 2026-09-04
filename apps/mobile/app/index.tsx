import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth';
import { getOnboarded } from '@/settings';
import { Screen, useTheme } from '@/ui';

export default function Index() {
  const theme = useTheme();
  const { session, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    getOnboarded().then(setOnboarded);
  }, []);

  if (loading || onboarded === null) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.text} size="large" />
        </View>
      </Screen>
    );
  }

  if (!onboarded) return <Redirect href="/onboarding" />;

  return <Redirect href={session ? '/flights' : '/login'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
