import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/ui/theme';
import { useMobileEndpoint } from '@/lib/api/mobileClient';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

type RewardItem = {
  id: string;
  title: string;
  cost: number;
  sponsor?: string;
};

type RewardsResponse = {
  balance: number;
  catalog: RewardItem[];
};

export const RewardsOverviewScreen = () => {
  const router = useRouter();
  const { data, loading, error, refresh } = useMobileEndpoint<RewardsResponse>('/api/mobile/rewards/catalog');
  const { featureFlags } = useMobileSession();
  const balance = data?.balance ?? 0;
  const catalog = data?.catalog ?? [];

  if (!featureFlags.REWARDS_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Rewards đang bị tắt.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
        <Pressable style={styles.refreshButton} onPress={refresh}>
          <Text style={styles.refreshLabel}>Refresh</Text>
        </Pressable>
      </View>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceValue}>{balance} pts</Text>
      </View>
      {error && <Text style={styles.error}>Rewards lỗi: {error.message}</Text>}
      {loading && <Text style={styles.placeholder}>Đang tải catalog…</Text>}
      {catalog.map((reward) => (
        <Pressable key={reward.id} style={styles.rewardCard} onPress={() => router.push(`/(drawer)/rewards/${reward.id}`)}>
          <Text style={styles.rewardTitle}>{reward.title}</Text>
          <Text style={styles.rewardMeta}>
            {reward.cost} pts {reward.sponsor ? `• ${reward.sponsor}` : ''}
          </Text>
        </Pressable>
      ))}
      {!loading && catalog.length === 0 && <Text style={styles.placeholder}>Chưa nhận được dữ liệu catalog.</Text>}
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
  balanceCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg,
    gap: spacing.xs
  },
  balanceLabel: {
    color: colors.textSecondary
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary
  },
  error: {
    color: colors.danger
  },
  placeholder: {
    color: colors.textSecondary
  },
  rewardCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg
  },
  rewardTitle: {
    fontWeight: '600',
    color: colors.textPrimary
  },
  rewardMeta: {
    color: colors.textSecondary
  }
});
