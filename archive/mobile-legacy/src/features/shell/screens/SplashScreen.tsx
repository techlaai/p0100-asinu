import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/ui/theme';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

export const SplashScreen = () => {
  const router = useRouter();
  const { session, loading, error } = useMobileSession();

  useEffect(() => {
    if (loading) return;

    if (session) {
      router.replace('/(drawer)/(tabs)');
    } else if (!loading) {
      router.replace('/(modals)/auth');
    }
  }, [session, loading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.title}>Loading your Asinu session…</Text>
      <Text style={styles.subtitle}>Awaiting `/api/mobile/session` + `/api/mobile/app-config`</Text>
      {error && <Text style={styles.error}>Session load failed: {error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md
  },
  title: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  subtitle: {
    color: colors.textSecondary
  },
  error: {
    color: colors.danger
  }
});
