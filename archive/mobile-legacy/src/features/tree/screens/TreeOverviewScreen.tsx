import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, spacing } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useMobileEndpoint } from '@/lib/api/mobileClient';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

type TreeState = {
  level: number;
  total_points: number;
  e_day: number;
  streak: number;
};

export const TreeOverviewScreen = () => {
  const router = useRouter();
  const { featureFlags } = useMobileSession();
  const { data, loading, error, refresh } = useMobileEndpoint<TreeState>('/api/mobile/tree/state');

  if (!featureFlags.TREE_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Tree flag đang tắt.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Life Tree</Text>
        <Pressable style={styles.refreshButton} onPress={refresh}>
          <Text style={styles.refreshLabel}>Refresh</Text>
        </Pressable>
      </View>
      {loading && <Text style={styles.placeholder}>Đang tải tree state…</Text>}
      {error && <Text style={styles.error}>{error.message}</Text>}
      {data && (
        <View style={styles.card}>
          <Text style={styles.meta}>Level {data.level}</Text>
          <Text style={styles.meta}>Tổng điểm {data.total_points}</Text>
          <Text style={styles.meta}>Hôm nay {data.e_day} pts</Text>
          <Text style={styles.meta}>Streak {data.streak} ngày</Text>
        </View>
      )}
      <Pressable style={styles.events} onPress={() => router.push('/(drawer)/tree/events')}>
        <Text style={styles.eventsLabel}>See events</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  refreshButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
    backgroundColor: colors.surface
  },
  refreshLabel: {
    color: colors.primary,
    fontWeight: '600'
  },
  placeholder: {
    color: colors.textSecondary
  },
  error: {
    color: colors.danger
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg,
    gap: spacing.sm
  },
  meta: {
    color: colors.textPrimary,
    fontWeight: '600'
  },
  events: {
    padding: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary
  },
  eventsLabel: {
    color: '#fff',
    fontWeight: '700'
  }
});
