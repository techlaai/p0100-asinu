import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/ui/theme';
import { useMobileEndpoint } from '@/lib/api/mobileClient';

type ProfileResponse = {
  name: string;
  energy: number;
  badges?: string[];
};

export const ProfileOverviewScreen = () => {
  const router = useRouter();
  const { data, loading, error, refresh } = useMobileEndpoint<ProfileResponse>('/api/mobile/profile');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Pressable style={styles.refreshButton} onPress={refresh}>
          <Text style={styles.refreshLabel}>Refresh</Text>
        </Pressable>
      </View>
      {loading && <Text style={styles.placeholder}>Đang tải profile…</Text>}
      {error && <Text style={styles.error}>{error.message}</Text>}
      {data && (
        <View style={styles.card}>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.energy}>Energy: {data.energy}</Text>
          <View style={styles.badges}>
            {(data.badges ?? []).map((badge) => (
              <Text key={badge} style={styles.badge}>
                {badge}
              </Text>
            ))}
          </View>
        </View>
      )}
      <Pressable style={styles.settings} onPress={() => router.push('/(drawer)/settings')}>
        <Text style={styles.settingsLabel}>Open settings</Text>
      </Pressable>
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
  placeholder: {
    color: colors.textSecondary
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
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary
  },
  energy: {
    color: colors.textSecondary
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md
  },
  settings: {
    padding: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary
  },
  settingsLabel: {
    color: '#fff',
    fontWeight: '700'
  }
});
