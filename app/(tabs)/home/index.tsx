import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsinuChatSticker from '../../../src/components/AsinuChatSticker';
import { Button } from '../../../src/components/Button';
import ChatModal from '../../../src/components/ChatModal';
import { FloatingActionButton } from '../../../src/components/FloatingActionButton';
import { NotificationBell } from '../../../src/components/NotificationBell';
import { OfflineBanner } from '../../../src/components/OfflineBanner';
import { Screen } from '../../../src/components/Screen';
import { StateError } from '../../../src/components/state/StateError';
import { StateLoading } from '../../../src/components/state/StateLoading';
import { useAuthStore } from '../../../src/features/auth/auth.store';
import { useHomeViewModel } from '../../../src/features/home/home.vm';
import { LogEntry } from '../../../src/features/logs/logs.store';
import { useNotificationStore } from '../../../src/stores/notification.store';
import { colors, spacing, typography } from '../../../src/styles';
import { C1TrendChart } from '../../../src/ui-kit/C1TrendChart';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';
import { H2HeroBanner } from '../../../src/ui-kit/H2HeroBanner';
import { M1MetricCard } from '../../../src/ui-kit/M1MetricCard';
import { T1ProgressRing } from '../../../src/ui-kit/T1ProgressRing';

export default function HomeScreen() {
  const [isChatOpen, setChatOpen] = useState(false);
  const router = useRouter();
  const {
    quickMetrics,
    missions,
    treeSummary,
    treeHistory,
    glucoseTrendData,
    logs,
    logsStatus,
    missionsStatus,
    treeStatus,
    logsError,
    missionsError,
    treeError,
    anyStale,
    refreshAll
  } = useHomeViewModel();
  const profile = useAuthStore((state) => state.profile);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  const handleRefresh = useCallback(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - refreshAll is stable

  const hasData = Boolean(treeSummary || missions.length || logs.length);
  const loading = logsStatus === 'loading' && missionsStatus === 'loading' && treeStatus === 'loading' && !hasData;
  const noDataError =
    (logsError === 'no-data' || missionsError === 'no-data' || treeError === 'no-data') && !hasData;

  return (
    <Screen>
      {anyStale ? <OfflineBanner /> : null}
      
      {/* Notification Bell in top right */}
      <View style={[styles.notificationContainer, { top: insets.top + spacing.sm }]}>
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onNotificationPress={(notification) => {
            // Handle notification press - navigate based on type
            if (notification.data?.type === 'care_circle_invitation') {
              router.push('/care-circle');
            } else if (notification.data?.type === 'health_alert') {
              // Navigate to logs or care circle based on alert
              if (notification.data?.alertType?.includes('glucose')) {
                router.push('/logs/glucose');
              } else if (notification.data?.alertType?.includes('blood_pressure')) {
                router.push('/logs/blood-pressure');
              } else {
                router.push('/care-circle');
              }
            }
          }}
        />
      </View>

      {loading ? <StateLoading /> : null}
      {noDataError ? <StateError onRetry={refreshAll} message="Không tải dữ liệu được" /> : null}
      {!hasData && !loading && !noDataError ? <StateError onRetry={refreshAll} message="Chưa có dữ liệu" /> : null}
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: padTop }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <H2HeroBanner
          name={profile?.name || 'Người chăm sóc'}
          relationship={profile?.relationship}
          summary="Cùng đồng hành với bạn mỗi ngày."
          action={
            <Button
              label="Cài đặt"
              variant="ghost"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: '#ffffff' }}
              textStyle={{ color: '#ffffff', fontWeight: '600' }}
              onPress={() => router.push('/settings')}
            />
          }
          supporters={['Bác sĩ', 'Người thân', 'Con cái']}
        />

        <View style={styles.metricsRow}>
          <M1MetricCard
            title="Đường huyết"
            value={quickMetrics.glucose ?? 0}
            unit="mg/dL"
            trend="flat"
            footnote="Ghi trước bữa sáng"
            accentColor={colors.secondary}
            accentGradient={[colors.secondary, colors.primary]}
            onPress={() => router.push('/logs/glucose')}
          />
          <M1MetricCard
            title="Huyết áp"
            value={quickMetrics.bloodPressure ?? 0}
            unit="mmHg"
            trend="down"
            accentColor={colors.warning}
            accentGradient={[colors.warning, colors.primary]}
            footnote="Theo dõi sáng nay"
            onPress={() => router.push('/logs/blood-pressure')}
          />
        </View>
        <AsinuChatSticker onPress={() => setChatOpen(true)} />

        <H1SectionHeader title="Nhiệm vụ hôm nay" subtitle="Làm mới mỗi ngày lúc 00:00 • Cố gắng hoàn thành 3 hàng đầu" />
        <View style={styles.cardList}>
        {missions.map((mission) => {
          const ratio = mission.goal > 0 ? mission.progress / mission.goal : 0;
          return (
            <View key={mission.id} style={styles.missionCard}>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              {mission.description ? <Text style={styles.missionDesc}>{mission.description}</Text> : null}
              <View style={styles.missionProgressRow}>
                <View style={styles.missionProgressTrack}>
                  <View style={[styles.missionProgressFill, { width: `${Math.min(ratio * 100, 100)}%` }]} />
                </View>
                <Text style={styles.missionProgressText}>{mission.progress}/{mission.goal}</Text>
              </View>
              <Button
                label={mission.status === 'completed' ? 'Đã hoàn thành' : 'Xem chi tiết'}
                variant={mission.status === 'completed' ? 'warning' : 'primary'}
                onPress={() => router.push('/missions')}
              />
            </View>
          );
        })}
        </View>

        <H1SectionHeader title="Cây sức khỏe" subtitle="50% log + 50% nhiệm vụ • Tính theo 7 ngày" />
        <View style={styles.treeRow}>
          <T1ProgressRing percentage={treeSummary?.score ?? 0.6} label="Điểm" accentColor={colors.warning} />
          <View style={styles.treeStats}>
            <View style={styles.treeStatRow}>
              <Ionicons name="flame" size={16} color="#ff6b6b" />
              <Text style={styles.treeStat}>Chuỗi: {treeSummary?.streakDays ?? 0} ngày</Text>
            </View>
            <View style={styles.treeStatRow}>
              <Ionicons name="checkmark-circle" size={16} color="#51cf66" />
              <Text style={styles.treeStat}>Tuần này: {treeSummary?.completedThisWeek ?? 0}/{treeSummary?.totalMissions ?? 0}</Text>
            </View>
            <Button label="Xem chi tiết" variant="ghost" onPress={() => router.push('/tree')} />
          </View>
        </View>

        <H1SectionHeader title="Xu hướng đường huyết" subtitle="7 ngày gần nhất" />
        <C1TrendChart
          data={glucoseTrendData.length > 0 ? glucoseTrendData : treeHistory}
          title="Đường huyết"
          unit="mg/dL"
        />

        <H1SectionHeader title="Nhật ký gần đây" />
        {logs.slice(0, 3).map((log: LogEntry) => (
          <View key={log.id} style={styles.logRow}>
            <Text style={styles.logType}>{log.type}</Text>
            <Text style={styles.logValue}>
              {log.type === 'glucose' && (log.value ? `${log.value} mg/dL` : 'Chưa có dữ liệu')}
              {log.type === 'blood-pressure' && (log.systolic && log.diastolic ? `${log.systolic}/${log.diastolic} mmHg` : 'Chưa có dữ liệu')}
              {log.type === 'weight' && (log.weight_kg ? `${log.weight_kg} kg` : 'Chưa có dữ liệu')}
              {log.type === 'water' && (log.volume_ml ? `${log.volume_ml} ml` : 'Chưa có dữ liệu')}
              {log.type === 'medication' && (log.medication || 'Chưa có dữ liệu')}
              {log.type === 'meal' && (log.title || 'Chưa có dữ liệu')}
              {log.type === 'insulin' && (log.insulin_type ? `${log.dose_units} U` : 'Chưa có dữ liệu')}
            </Text>
          </View>
        ))}
      </ScrollView>
      <FloatingActionButton label="Ghi nhanh" onPress={() => router.push('/logs')} />
      <ChatModal visible={isChatOpen} onClose={() => setChatOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg
  },
  notificationContainer: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 1000,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md
  },
  cardList: {
    gap: spacing.md
  },
  missionCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    gap: spacing.sm
  },
  missionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700'
  },
  missionDesc: {
    color: colors.textSecondary,
    fontSize: typography.size.md
  },
  missionProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  missionProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden'
  },
  missionProgressFill: {
    height: '100%',
    backgroundColor: colors.primary
  },
  missionProgressText: {
    fontWeight: '700',
    color: colors.textPrimary
  },
  treeRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center'
  },
  treeStats: {
    flex: 1,
    gap: spacing.sm
  },
  treeStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  treeStat: {
    fontSize: typography.size.md,
    color: colors.textPrimary
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  logType: {
    textTransform: 'capitalize',
    color: colors.textSecondary,
    fontSize: typography.size.sm
  },
  logValue: {
    fontWeight: '700',
    fontSize: typography.size.md
  }
});
