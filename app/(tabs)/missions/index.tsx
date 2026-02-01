import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineBanner } from '../../../src/components/OfflineBanner';
import { Screen } from '../../../src/components/Screen';
import { StateEmpty } from '../../../src/components/state/StateEmpty';
import { StateError } from '../../../src/components/state/StateError';
import { StateLoading } from '../../../src/components/state/StateLoading';
import { useMissionActions } from '../../../src/features/missions/useMissionActions';
import { colors, spacing, typography } from '../../../src/styles';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty deps - fetchMissions is stable in Zustand
  );

  const handleRefresh = useCallback(() => {
    const controller = new AbortController();
    fetchMissions(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - fetchMissions is stable in Zustand

  return (
    <Screen>
      {isStale || errorState === 'remote-failed' ? <OfflineBanner /> : null}
      {status === 'loading' && missions.length === 0 ? <StateLoading /> : null}
      {errorState === 'no-data' && missions.length === 0 ? (
        <StateError onRetry={() => fetchMissions()} message="Không tải dữ liệu được" />
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: padTop }]}
        refreshControl={
          <RefreshControl 
            refreshing={status === 'loading'} 
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {status === 'success' && missions.length === 0 ? <StateEmpty /> : null}
        <H1SectionHeader title="Nhiệm vụ hàng ngày" subtitle="Làm mới mỗi ngày lúc 00:00 • Lịch sử được lưu vĩnh viễn" />
        
        {/* Thông tin hướng dẫn */}
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="information-circle" size={20} color={colors.secondary} />
            <Text style={styles.infoTitle}>Cách hoạt động</Text>
          </View>
          <Text style={styles.infoText}>• Nhiệm vụ reset tiến trình mỗi ngày</Text>
          <Text style={styles.infoText}>• Khi hoàn thành, điểm được cộng vào "Cây sức khỏe"</Text>
          <Text style={styles.infoText}>• Lịch sử hoàn thành được lưu để theo dõi</Text>
        </View>
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
  infoCard: {
    padding: spacing.lg,
    backgroundColor: colors.secondary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  infoTitle: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: spacing.xs
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs
  },
  infoText: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 20
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
