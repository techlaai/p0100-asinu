import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/ui/theme';
import { useMobileEndpoint } from '@/lib/api/mobileClient';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

type HomeDashboardResponse = {
  greeting?: string;
  missions?: Array<{ id: string; title: string; status: 'pending' | 'done' }>;
  summary?: { completed: number; total: number };
  energy?: { level: number; total_points: number; e_day: number; streak: number };
  donate?: { total_points: number; total_vnd: number; highlight?: { provider: string } | null };
};

export const HomeDashboardScreen = () => {
  const router = useRouter();
  const { data, loading, error, refresh } = useMobileEndpoint<HomeDashboardResponse>('/api/mobile/dashboard');
  const { featureFlags } = useMobileSession();

  const handleCta = (path: string) => {
    router.push(path);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>{data?.greeting ?? 'Chào bạn'}</Text>
        <Text style={styles.subtitle}>Family-Health snapshot hiển thị khi API sẵn sàng.</Text>
        <Pressable style={styles.refreshButton} onPress={refresh}>
          <Text style={styles.refreshLabel}>Refresh</Text>
        </Pressable>
        {error && <Text style={styles.error}>Dashboard error: {error.message}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Missions</Text>
        {!featureFlags.MISSIONS_ENABLED && <Text style={styles.placeholder}>Mission flag đang tắt.</Text>}
        {featureFlags.MISSIONS_ENABLED && loading && <Text style={styles.placeholder}>Loading missions…</Text>}
        {featureFlags.MISSIONS_ENABLED &&
          !loading &&
          (data?.missions?.length ? (
            data.missions.map((mission) => (
              <Pressable key={mission.id} style={styles.listRow} onPress={() => handleCta(`/(drawer)/missions/${mission.id}`)}>
                <Text style={styles.listTitle}>{mission.title}</Text>
                <Text style={styles.listStatus}>{mission.status}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.placeholder}>Chưa có dữ liệu `/api/mobile/missions/today`.</Text>
          ))}
        <View style={styles.ctaRow}>
          {featureFlags.MISSIONS_ENABLED && (
            <Pressable style={styles.ctaButton} onPress={() => handleCta('/(drawer)/(tabs)/missions')}>
              <Text style={styles.ctaLabel}>Checklist</Text>
            </Pressable>
          )}
          {featureFlags.DONATE_ENABLED && (
            <Pressable style={styles.ctaButton} onPress={() => handleCta('/(drawer)/donate/do')}>
              <Text style={styles.ctaLabel}>Donate</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Energy</Text>
        {!featureFlags.TREE_ENABLED && <Text style={styles.placeholder}>Tree flag đang tắt.</Text>}
        {featureFlags.TREE_ENABLED && data?.energy ? (
          <>
            <Text style={styles.energyValue}>{data.energy.total_points} pts</Text>
            <Text style={styles.subtitle}>Level {data.energy.level} · Hôm nay {data.energy.e_day} pts</Text>
            <Text style={styles.subtitle}>Streak {data.energy.streak} ngày</Text>
          </>
        ) : featureFlags.TREE_ENABLED ? (
          <Text style={styles.placeholder}>Awaiting `/api/mobile/rewards/summary`.</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick links</Text>
        <View style={styles.quicklinks}>
          {featureFlags.REWARDS_ENABLED && (
            <Pressable style={styles.quickButton} onPress={() => handleCta('/(drawer)/(tabs)/rewards')}>
              <Text style={styles.quickLabel}>Rewards</Text>
            </Pressable>
          )}
          {featureFlags.TREE_ENABLED && (
            <Pressable style={styles.quickButton} onPress={() => handleCta('/(drawer)/(tabs)/tree')}>
              <Text style={styles.quickLabel}>Life Tree</Text>
            </Pressable>
          )}
          {featureFlags.FAMILY_ENABLED && (
            <Pressable style={styles.quickButton} onPress={() => handleCta('/(drawer)/(tabs)/family')}>
              <Text style={styles.quickLabel}>Family</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.background
  },
  hero: {
    gap: spacing.sm
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subtitle: {
    color: colors.textSecondary
  },
  refreshButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
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
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg,
    gap: spacing.sm
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary
  },
  placeholder: {
    color: colors.textSecondary
  },
  listRow: {
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1
  },
  listTitle: {
    color: colors.textPrimary
  },
  listStatus: {
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontSize: 12
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  ctaButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.primary
  },
  ctaLabel: {
    color: '#fff',
    fontWeight: '600'
  },
  energyValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary
  },
  quicklinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  quickButton: {
    flexBasis: '30%',
    padding: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center'
  },
  quickLabel: {
    color: colors.textPrimary,
    fontWeight: '600'
  }
});
