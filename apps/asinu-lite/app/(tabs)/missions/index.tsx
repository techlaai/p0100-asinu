import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMissionActions } from '../../../src/features/missions/useMissionActions';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';
import { Button } from '../../../src/components/Button';
import { colors, spacing, typography } from '../../../src/styles';

export default function MissionsScreen() {
  const { missions, status, toggleComplete } = useMissionActions();

  useEffect(() => {
    // ensure data ready
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1SectionHeader title="Nhiệm vụ" subtitle="Cập nhật trong ngày" />
      {missions.map((mission) => (
        <View key={mission.id} style={styles.card}>
          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.description}>{mission.description}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{mission.category}</Text>
            <Text style={styles.meta}>Điểm: {mission.points ?? 0}</Text>
          </View>
          <Button
            label={mission.completed ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
            variant={mission.completed ? 'secondary' : 'primary'}
            onPress={() => toggleComplete(mission.id)}
          />
        </View>
      ))}
      {status === 'loading' && <Text style={styles.description}>Đang tải dữ liệu...</Text>}
    </ScrollView>
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
    color: colors.textSecondary
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  meta: {
    color: colors.textSecondary,
    fontWeight: '600'
  }
});
