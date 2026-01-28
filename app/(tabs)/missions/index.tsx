import { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useMissionActions } from '../../../src/features/missions/useMissionActions';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';
import { Screen } from '../../../src/components/Screen';
import { colors, spacing, typography } from '../../../src/styles';
import { StateLoading } from '../../../src/components/state/StateLoading';
import { StateError } from '../../../src/components/state/StateError';
import { StateEmpty } from '../../../src/components/state/StateEmpty';
import { OfflineBanner } from '../../../src/components/OfflineBanner';

export default function MissionsScreen() {
  const { missions, status, isStale, errorState, fetchMissions } = useMissionActions();
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  useEffect(() => {
    // ensure data ready
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      fetchMissions(controller.signal);
      return () => controller.abort();
    }, [fetchMissions])
  );

  const handleRefresh = useCallback(() => {
    const controller = new AbortController();
    fetchMissions(controller.signal);
    return () => controller.abort();
  }, [fetchMissions]);

  return (
    <Screen>
      {isStale || errorState === 'remote-failed' ? <OfflineBanner /> : null}
      {status === 'loading' && missions.length === 0 ? <StateLoading /> : null}
      {errorState === 'no-data' && missions.length === 0 ? (
        <StateError onRetry={() => fetchMissions()} message="Không tải dữ liệu được" />
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: padTop }]}
        refreshControl={<RefreshControl refreshing={status === 'loading'} onRefresh={handleRefresh} />}
      >
        {status === 'success' && missions.length === 0 ? <StateEmpty /> : null}
        <H1SectionHeader title="Nhiệm vụ" subtitle="Cập nhật trong ngày" />
        {missions.map((mission) => {
          const progressRatio = mission.goal > 0 ? mission.progress / mission.goal : 0;
          return (
            <View key={mission.id} style={styles.card}>
              <Text style={styles.title}>{mission.title}</Text>
              {mission.description ? <Text style={styles.description}>{mission.description}</Text> : null}
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(progressRatio * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {mission.progress}/{mission.goal}
                </Text>
              </View>
              <Text style={styles.statusText}>{mission.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'}</Text>
            </View>
          );
        })}
        {status === 'loading' && <Text style={styles.description}>Đang tải dữ liệu...</Text>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.md
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700'
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.size.md
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary
  },
  progressText: {
    fontWeight: '700',
    color: colors.textPrimary
  },
  statusText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  }
});
