import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/ui/theme';
import { useMobileEndpoint } from '@/lib/api/mobileClient';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

type DonateSummary = {
  total_points?: number;
  total_vnd?: number;
  recent?: Array<{ id: string; amount: number; provider: string }>;
};

export const DonateOverviewScreen = () => {
  const router = useRouter();
  const { data, loading, error, refresh } = useMobileEndpoint<DonateSummary>('/api/mobile/donate/summary');
  const { featureFlags } = useMobileSession();

  if (!featureFlags.DONATE_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Donate đang bị tắt.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Donate</Text>
        <Pressable style={styles.refreshButton} onPress={refresh}>
          <Text style={styles.refreshLabel}>Refresh</Text>
        </Pressable>
      </View>
      <View style={styles.stats}>
        <Text style={styles.statLabel}>Total points</Text>
        <Text style={styles.statValue}>{data?.total_points ?? 0}</Text>
        <Text style={styles.statLabel}>Total VND</Text>
        <Text style={styles.statValue}>{data?.total_vnd ?? 0}</Text>
      </View>
      {loading && <Text style={styles.placeholder}>Đang tải donate summary…</Text>}
      {error && <Text style={styles.error}>Không tải được donate summary: {error.message}</Text>}
      {data?.recent?.length ? (
        <View style={styles.recent}>
          {data.recent.map((entry) => (
            <Text key={entry.id} style={styles.recentItem}>
              {entry.amount} ({entry.provider})
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.placeholder}>Chưa có giao dịch donate.</Text>
      )}
      <Pressable style={styles.cta} onPress={() => router.push('/(drawer)/donate/do')}>
        <Text style={styles.ctaLabel}>Bắt đầu Donate</Text>
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
  stats: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg,
    gap: spacing.xs
  },
  statLabel: {
    color: colors.textSecondary
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary
  },
  placeholder: {
    color: colors.textSecondary
  },
  error: {
    color: colors.danger
  },
  recent: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg,
    gap: spacing.xs
  },
  recentItem: {
    color: colors.textPrimary
  },
  cta: {
    padding: spacing.lg,
    borderRadius: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.primary
  },
  ctaLabel: {
    color: '#fff',
    fontWeight: '700'
  }
});
