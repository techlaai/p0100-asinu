import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTreeStore } from '../../../src/features/tree/tree.store';
import { useLogsStore } from '../../../src/features/logs/logs.store';
import { useAuthStore } from '../../../src/features/auth/auth.store';
import { Screen } from '../../../src/components/Screen';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';
import { T1ProgressRing } from '../../../src/ui-kit/T1ProgressRing';
import { C1TrendChart } from '../../../src/ui-kit/C1TrendChart';
import { colors, spacing, typography } from '../../../src/styles';
import { Button } from '../../../src/components/Button';
import { StateLoading } from '../../../src/components/state/StateLoading';
import { StateError } from '../../../src/components/state/StateError';
import { StateEmpty } from '../../../src/components/state/StateEmpty';
import { OfflineBanner } from '../../../src/components/OfflineBanner';
import { DEMO_ACCOUNT_EMAIL } from '../../../src/lib/links';

export default function TreeScreen() {
  const summary = useTreeStore((state) => state.summary);
  const history = useTreeStore((state) => state.history);
  const fetchTree = useTreeStore((state) => state.fetchTree);
  const status = useTreeStore((state) => state.status);
  const isStale = useTreeStore((state) => state.isStale);
  const errorState = useTreeStore((state) => state.errorState);
  const recentLogs = useLogsStore((state) => state.recent);
  const profile = useAuthStore((state) => state.profile);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  // isDemoAccount derived from profile email matching DEMO_ACCOUNT_EMAIL
  const isDemoAccount = Boolean(
    profile?.email?.toLowerCase().includes(DEMO_ACCOUNT_EMAIL)
  );

  const demoHistory = useMemo(
    () => [
      { label: 'T2', value: 118 },
      { label: 'T3', value: 124 },
      { label: 'T4', value: 121 },
      { label: 'T5', value: 130 },
      { label: 'T6', value: 126 },
      { label: 'T7', value: 122 },
      { label: 'CN', value: 128 }
    ],
    []
  );

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

  const demoMetrics = [
    {
      key: 'glucose',
      title: 'Đường huyết',
      value: '128',
      unit: 'mg/dL',
      meta: 'Gần nhất: 07:45',
      trend: 'Ổn định'
    },
    {
      key: 'blood-pressure',
      title: 'Huyết áp',
      value: '125/78',
      unit: 'mmHg',
      meta: 'Gần nhất: 08:10',
      trend: 'Bình thường'
    },
    {
      key: 'weight',
      title: 'Cân nặng',
      value: '67.2',
      unit: 'kg',
      meta: 'Gần nhất: 07:30',
      trend: 'Ổn định'
    },
    {
      key: 'water',
      title: 'Nước uống',
      value: '1200 / 2000',
      unit: 'ml',
      meta: 'Hôm nay',
      trend: 'Cần thêm'
    }
  ];

  const liveMetrics = [
    {
      key: 'glucose',
      title: 'Đường huyết',
      value: typeof glucoseLog?.value === 'number' ? `${glucoseLog.value}` : '--',
      unit: 'mg/dL',
      meta: glucoseLog?.recordedAt
        ? `Gần nhất: ${formatTime(glucoseLog.recordedAt)}`
        : 'Chưa có dữ liệu'
    },
    {
      key: 'blood-pressure',
      title: 'Huyết áp',
      value:
        typeof bpLog?.systolic === 'number' && typeof bpLog?.diastolic === 'number'
          ? `${bpLog.systolic}/${bpLog.diastolic}`
          : '--',
      unit: 'mmHg',
      meta: bpLog?.recordedAt ? `Gần nhất: ${formatTime(bpLog.recordedAt)}` : 'Chưa có dữ liệu'
    },
    {
      key: 'weight',
      title: 'Cân nặng',
      value: typeof weightLog?.weight_kg === 'number' ? `${weightLog.weight_kg}` : '--',
      unit: 'kg',
      meta: weightLog?.recordedAt ? `Gần nhất: ${formatTime(weightLog.recordedAt)}` : 'Chưa có dữ liệu'
    },
    {
      key: 'water',
      title: 'Nước uống',
      value: typeof waterLog?.volume_ml === 'number' ? `${waterLog.volume_ml}` : '--',
      unit: 'ml',
      meta: waterLog?.volume_ml ? 'Hôm nay' : 'Chưa có dữ liệu'
    }
  ];

  const metrics = isDemoAccount ? demoMetrics : liveMetrics;
  const hasAnyMetric = metrics.some((metric) => metric.value !== '--');
  const showChart = isDemoAccount || hasAnyMetric;
  const chartData = isDemoAccount ? demoHistory : showChart ? history : [];

  useEffect(() => {
    const controller = new AbortController();
    fetchTree(controller.signal);
    return () => controller.abort();
  }, [fetchTree]);

  return (
    <Screen>
      {isStale || errorState === 'remote-failed' ? <OfflineBanner /> : null}
      {status === 'loading' && !summary ? <StateLoading /> : null}
      {errorState === 'no-data' && !summary ? <StateError onRetry={() => fetchTree()} message="Không tải dữ liệu được" /> : null}
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: padTop }]}>
        {status === 'success' && !summary ? <StateEmpty /> : null}
        <H1SectionHeader
          title="Cây sức khỏe"
          subtitle="Tổng hợp từ dữ liệu bạn ghi log (đường huyết, huyết áp, cân nặng, nước uống)"
        />
        <View style={styles.row}>
          <View style={styles.scoreBlock}>
            <T1ProgressRing percentage={summary?.score ?? 0.6} label="Điểm" accentColor={colors.warning} />
            <Text style={styles.scoreCaption}>
              Điểm tổng hợp từ các chỉ số sức khỏe (7 ngày gần nhất)
            </Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaText}>Chuỗi ngày tốt: {summary?.streakDays ?? 0}</Text>
            <Text style={styles.metaText}>
              Nhiệm vụ tuần: {summary?.completedThisWeek ?? 0}/{summary?.totalMissions ?? 0}
            </Text>
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
        {!isDemoAccount && !hasAnyMetric ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Bạn chưa có dữ liệu. Hãy ghi log hôm nay để thấy tiến trình.
            </Text>
            <Button label="Ghi nhanh" onPress={() => router.push('/logs')} />
          </View>
        ) : null}
        <Text style={styles.chartLabel}>Biểu đồ chỉ số sức khỏe</Text>
        {showChart ? (
          <C1TrendChart data={chartData} />
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>Chưa có dữ liệu biểu đồ</Text>
          </View>
        )}
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
  chartLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
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
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  placeholderText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  }
});
