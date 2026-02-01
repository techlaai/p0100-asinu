import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/Button';
import { OfflineBanner } from '../../../src/components/OfflineBanner';
import { Screen } from '../../../src/components/Screen';
import { StateEmpty } from '../../../src/components/state/StateEmpty';
import { StateError } from '../../../src/components/state/StateError';
import { StateLoading } from '../../../src/components/state/StateLoading';
import { useLogsStore } from '../../../src/features/logs/logs.store';
import { useTreeStore } from '../../../src/features/tree/tree.store';
import { colors, spacing, typography } from '../../../src/styles';
import { C1TrendChart } from '../../../src/ui-kit/C1TrendChart';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';
import { T1ProgressRing } from '../../../src/ui-kit/T1ProgressRing';

export default function TreeScreen() {
  const summary = useTreeStore((state) => state.summary);
  const history = useTreeStore((state) => state.history);
  const fetchTree = useTreeStore((state) => state.fetchTree);
  const status = useTreeStore((state) => state.status);
  const isStale = useTreeStore((state) => state.isStale);
  const errorState = useTreeStore((state) => state.errorState);
  const recentLogs = useLogsStore((state) => state.recent);
  const fetchLogs = useLogsStore((state) => state.fetchRecent);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  const formatTime = (iso?: string) => {
    if (!iso) {
      return '';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const latestLogByType = (type: string) =>
    recentLogs.find((log) => log.type === type);

  const glucoseLog = latestLogByType('glucose');
  const bpLog = latestLogByType('blood-pressure');
  const weightLog = latestLogByType('weight');
  const waterLog = latestLogByType('water');

  const metrics = [
    {
      key: 'glucose',
      title: 'Đường huyết',
      value: typeof glucoseLog?.value === 'number' ? `${glucoseLog.value}` : '--',
      unit: 'mg/dL',
      meta: glucoseLog?.recordedAt
        ? `Gần nhất: ${formatTime(glucoseLog.recordedAt)}`
        : 'Chưa có dữ liệu',
      trend: undefined
    },
    {
      key: 'blood-pressure',
      title: 'Huyết áp',
      value:
        typeof bpLog?.systolic === 'number' && typeof bpLog?.diastolic === 'number'
          ? `${bpLog.systolic}/${bpLog.diastolic}`
          : '--',
      unit: 'mmHg',
      meta: bpLog?.recordedAt ? `Gần nhất: ${formatTime(bpLog.recordedAt)}` : 'Chưa có dữ liệu',
      trend: undefined
    },
    {
      key: 'weight',
      title: 'Cân nặng',
      value: typeof weightLog?.weight_kg === 'number' ? `${weightLog.weight_kg}` : '--',
      unit: 'kg',
      meta: weightLog?.recordedAt ? `Gần nhất: ${formatTime(weightLog.recordedAt)}` : 'Chưa có dữ liệu',
      trend: undefined
    },
    {
      key: 'water',
      title: 'Nước uống',
      value: typeof waterLog?.volume_ml === 'number' ? `${waterLog.volume_ml}` : '--',
      unit: 'ml',
      meta: waterLog?.volume_ml ? 'Hôm nay' : 'Chưa có dữ liệu',
      trend: undefined
    }
  ];

  const hasAnyMetric = metrics.some((metric) => metric.value !== '--');
  const showChart = hasAnyMetric;
  const chartData = showChart ? history : [];

  // Tự động fetch khi tab được focus (không cần pull to refresh)
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      fetchTree(controller.signal);
      fetchLogs(controller.signal);
      return () => controller.abort();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty deps - fetchTree and fetchLogs are stable in Zustand
  );

  const handleRefresh = useCallback(() => {
    const controller = new AbortController();
    fetchTree(controller.signal);
    fetchLogs(controller.signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - fetchTree and fetchLogs are stable in Zustand

  return (
    <Screen>
      {isStale || errorState === 'remote-failed' ? <OfflineBanner /> : null}
      {status === 'loading' && !summary ? <StateLoading /> : null}
      {errorState === 'no-data' && !summary ? <StateError onRetry={() => fetchTree()} message="Không tải dữ liệu được" /> : null}
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
        {status === 'success' && !summary ? <StateEmpty /> : null}
        <H1SectionHeader
          title="Cây sức khỏe"
          subtitle="Tổng hợp từ dữ liệu bạn ghi log (đường huyết, huyết áp, cân nặng, nước uống)"
        />
        
        {/* Giải thích cách tính điểm */}
        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="bar-chart" size={18} color={colors.secondary} />
            <Text style={styles.infoTitle}>Cách tính điểm</Text>
          </View>
          <Text style={styles.infoText}>• 50% từ số lần ghi log (tối đa 14 lần/tuần)</Text>
          <Text style={styles.infoText}>• 50% từ nhiệm vụ hoàn thành</Text>
          <Text style={styles.infoText}>• Dữ liệu tính theo 7 ngày gần nhất</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.scoreBlock}>
            <T1ProgressRing percentage={summary?.score ?? 0.6} label="Điểm" accentColor={colors.warning} />
            <Text style={styles.scoreCaption}>
              {Math.round((summary?.score ?? 0) * 100)}% - {(summary?.score ?? 0) >= 0.7 ? 'Tốt' : (summary?.score ?? 0) >= 0.4 ? 'Trung bình' : 'Cần cố gắng'}
            </Text>
          </View>
          <View style={styles.meta}>
            <View style={styles.metaRow}>
              <Ionicons name="flame" size={16} color="#ff6b6b" />
              <Text style={styles.metaText}>Chuỗi ngày tốt: {summary?.streakDays ?? 0} ngày</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="checkmark-circle" size={16} color="#51cf66" />
              <Text style={styles.metaText}>
                Nhiệm vụ tuần: {summary?.completedThisWeek ?? 0}/{summary?.totalMissions ?? 0}
              </Text>
            </View>
            <Text style={styles.metaSubtext}>(Nhiệm vụ làm mới mỗi ngày)</Text>
          </View>
        </View>
        <View style={styles.metricGrid}>
          {metrics.map((metric) => (
            <View key={metric.key} style={styles.metricCard}>
              <Text style={styles.metricTitle}>{metric.title}</Text>
              <View style={styles.metricValueRow}>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricUnit}>{metric.unit}</Text>
              </View>
              <Text style={styles.metricMeta}>{metric.meta}</Text>
              {metric.trend ? <Text style={styles.metricTrend}>{metric.trend}</Text> : null}
            </View>
          ))}
        </View>
        {!hasAnyMetric ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Bạn chưa có dữ liệu. Hãy ghi log hôm nay để thấy tiến trình.
            </Text>
          </View>
        ) : null}
        
        <Button label="Ghi nhanh" onPress={() => router.push('/logs')} />
        
        {/* Biểu đồ 7 ngày với giải thích */}
        <View style={styles.chartSection}>
          <View style={styles.chartLabelRow}>
            <Ionicons name="bar-chart" size={18} color={colors.textSecondary} />
            <Text style={styles.chartLabel}>Biểu đồ hoạt động 7 ngày gần nhất</Text>
          </View>
          <Text style={styles.chartExplain}>Mỗi lần ghi log = 25 điểm • Tối đa 100 điểm/ngày (4 lần ghi)</Text>
          {showChart ? (
            <C1TrendChart data={chartData} title="Điểm hoạt động" unit="điểm" />
          ) : (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>Chưa có dữ liệu biểu đồ</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center'
  },
  scoreBlock: {
    flex: 1,
    gap: spacing.sm
  },
  scoreCaption: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  meta: {
    gap: spacing.sm
  },
  metaText: {
    fontSize: typography.size.md,
    color: colors.textPrimary
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  metaSubtext: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontStyle: 'italic'
  },
  infoBox: {
    padding: spacing.lg,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: spacing.xs
  },
  infoTitle: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.primary,
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
  chartSection: {
    gap: spacing.sm
  },
  chartLabel: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.textPrimary
  },
  chartLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  chartExplain: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '48%',
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm
  },
  metricTitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs
  },
  metricValue: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary
  },
  metricUnit: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  metricMeta: {
    fontSize: typography.size.xs,
    color: colors.textSecondary
  },
  metricTrend: {
    fontSize: typography.size.xs,
    color: colors.textPrimary
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md
  },
  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textPrimary
  },
  placeholderCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  placeholderText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  }
});
