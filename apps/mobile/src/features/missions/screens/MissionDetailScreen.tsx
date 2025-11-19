import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, spacing } from '@/ui/theme';
import { useMobileEndpoint, mobileRequest } from '@/lib/api/mobileClient';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

type MissionDetail = {
  id: string;
  title: string;
  description?: string;
  sponsor?: string;
  logs?: Array<{ id: string; ts: string; note?: string }>;
};

type Props = {
  missionId?: string;
};

export const MissionDetailScreen = ({ missionId }: Props) => {
  const { featureFlags } = useMobileSession();
  const { data, loading, error, refresh } = useMobileEndpoint<MissionDetail>(missionId ? `/api/mobile/missions/${missionId}` : null);

  if (!featureFlags.MISSIONS_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Mission flag đang tắt.</Text>
      </View>
    );
  }

  if (!missionId) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Mission id missing</Text>
      </View>
    );
  }

  const handleComplete = async () => {
    await mobileRequest('/api/mobile/missions/checkin', {
      method: 'POST',
      body: { mission_id: missionId }
    });
    refresh();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading && <Text style={styles.placeholder}>Đang tải mission…</Text>}
      {error && <Text style={styles.error}>{error.message}</Text>}
      {data && (
        <>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.description}</Text>
          {data.sponsor && <Text style={styles.sponsor}>Sponsor: {data.sponsor}</Text>}
          <Pressable style={styles.complete} onPress={handleComplete}>
            <Text style={styles.completeLabel}>Mark done</Text>
          </Pressable>
          <View style={styles.logs}>
            <Text style={styles.logsTitle}>Recent logs</Text>
            {(data.logs ?? []).map((log) => (
              <Text key={log.id} style={styles.logItem}>
                {log.ts} {log.note}
              </Text>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subtitle: {
    color: colors.textSecondary
  },
  sponsor: {
    color: colors.textPrimary,
    fontWeight: '600'
  },
  placeholder: {
    color: colors.textSecondary
  },
  error: {
    color: colors.danger
  },
  complete: {
    padding: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary
  },
  completeLabel: {
    color: '#fff',
    fontWeight: '700'
  },
  logs: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg,
    gap: spacing.xs
  },
  logsTitle: {
    fontWeight: '600',
    color: colors.textPrimary
  },
  logItem: {
    color: colors.textSecondary
  }
});
