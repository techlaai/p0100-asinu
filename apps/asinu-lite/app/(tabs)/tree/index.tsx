import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTreeStore } from '../../../src/features/tree/tree.store';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';
import { T1ProgressRing } from '../../../src/ui-kit/T1ProgressRing';
import { C1TrendChart } from '../../../src/ui-kit/C1TrendChart';
import { colors, spacing, typography } from '../../../src/styles';

export default function TreeScreen() {
  const summary = useTreeStore((state) => state.summary);
  const history = useTreeStore((state) => state.history);
  const fetchTree = useTreeStore((state) => state.fetchTree);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1SectionHeader title="Cây sức khoẻ" subtitle="Theo dõi tiến trình" />
      <View style={styles.row}>
        <T1ProgressRing percentage={summary?.score ?? 0.6} label="Điểm" />
        <View style={styles.meta}>
          <Text style={styles.metaText}>Chuỗi ngày tốt: {summary?.streakDays ?? 0}</Text>
          <Text style={styles.metaText}>
            Nhiệm vụ tuần: {summary?.completedThisWeek ?? 0}/{summary?.totalMissions ?? 0}
          </Text>
        </View>
      </View>
      <C1TrendChart data={history} />
    </ScrollView>
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
  meta: {
    gap: spacing.sm
  },
  metaText: {
    fontSize: typography.size.md,
    color: colors.textPrimary
  }
});
