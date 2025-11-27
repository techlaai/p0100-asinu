import { StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, spacing } from '@/ui/theme';
import { useMobileEndpoint, mobileRequest } from '@/lib/api/mobileClient';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

type RewardDetail = {
  id: string;
  title: string;
  description?: string;
  cost: number;
};

type Props = {
  rewardId?: string;
};

export const RewardDetailScreen = ({ rewardId }: Props) => {
  const { featureFlags } = useMobileSession();
  // Kiểm tra feature flag ngay trong function component:
  if (!featureFlags.REWARDS_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Rewards đang tắt.</Text>
      </View>
    );
  }

  const { data, loading, error, refresh } = useMobileEndpoint<RewardDetail>(rewardId ? `/api/mobile/rewards/${rewardId}` : null);


  const handleRedeem = async () => {
    if (!rewardId) return;
    await mobileRequest('/api/mobile/rewards/redeem', {
      method: 'POST',
      body: { reward_id: rewardId }
    });
    refresh();
  };

  if (!rewardId) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Missing reward id.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && <Text style={styles.placeholder}>Loading reward…</Text>}
      {error && <Text style={styles.error}>{error.message}</Text>}
      {data && (
        <>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.cost}>{data.cost} pts</Text>
          <Text style={styles.description}>{data.description}</Text>
          <Pressable style={styles.redeem} onPress={handleRedeem}>
            <Text style={styles.redeemLabel}>Redeem</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  cost: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary
  },
  description: {
    color: colors.textSecondary
  },
  placeholder: {
    color: colors.textSecondary
  },
  error: {
    color: colors.danger
  },
  redeem: {
    padding: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary
  },
  redeemLabel: {
    color: '#fff',
    fontWeight: '700'
  }
});
