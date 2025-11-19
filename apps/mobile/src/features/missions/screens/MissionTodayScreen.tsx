import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/ui/theme';
import { useMobileEndpoint } from '@/lib/api/mobileClient';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

type Mission = {
  id: string;
  title: string;
  status: 'pending' | 'done';
  reward?: number;
};

type MissionsResponse = {
  missions: Mission[];
};

export const MissionTodayScreen = () => {
  const router = useRouter();
  const { data, loading, error, refresh } = useMobileEndpoint<MissionsResponse>('/api/mobile/missions/today');
  const { featureFlags } = useMobileSession();

  const missions = data?.missions ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today&apos;s Missions</Text>
        <Pressable style={styles.refreshButton} onPress={refresh}>
          <Text style={styles.refreshLabel}>Refresh</Text>
        </Pressable>
      </View>
      {!featureFlags.MISSIONS_ENABLED && <Text style={styles.placeholder}>Mission đang tắt trong feature flag.</Text>}
      {featureFlags.MISSIONS_ENABLED && error && <Text style={styles.error}>Không load được missions: {error.message}</Text>}
      {featureFlags.MISSIONS_ENABLED && loading && <Text style={styles.placeholder}>Đang tải…</Text>}
      {featureFlags.MISSIONS_ENABLED && !loading && missions.length === 0 && <Text style={styles.placeholder}>Chưa có dữ liệu. Cần `/api/mobile/missions/today`.</Text>}

      {featureFlags.MISSIONS_ENABLED &&
        missions.map((mission) => (
          <Pressable key={mission.id} style={styles.card} onPress={() => router.push(`/(drawer)/missions/${mission.id}`)}>
            <Text style={styles.cardTitle}>{mission.title}</Text>
            <Text style={styles.cardStatus}>{mission.status}</Text>
            {mission.reward && <Text style={styles.cardReward}>+{mission.reward} pts</Text>}
          </Pressable>
        ))}
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
  error: {
    color: colors.danger
  },
  placeholder: {
    color: colors.textSecondary
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg,
    gap: spacing.xs
  },
  cardTitle: {
    fontWeight: '600',
    color: colors.textPrimary
  },
  cardStatus: {
    color: colors.textSecondary,
    textTransform: 'uppercase'
  },
  cardReward: {
    color: colors.success,
    fontWeight: '600'
  }
});
