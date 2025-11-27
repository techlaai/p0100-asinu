import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, spacing } from '@/ui/theme';
import { useRouter } from 'expo-router';
import { useMobileEndpoint } from '@/lib/api/mobileClient';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

type FamilyMember = {
  id: string;
  name: string;
  role: string;
};

type FamilyResponse = {
  members: FamilyMember[];
  invites: Array<{ id: string; email: string }>;
};

export const FamilyOverviewScreen = () => {
  const router = useRouter();
  const { data, loading, error, refresh } = useMobileEndpoint<FamilyResponse>('/api/mobile/family');
  const { featureFlags } = useMobileSession();

  if (!featureFlags.FAMILY_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Family flag đang tắt.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family</Text>
        <Pressable style={styles.refreshButton} onPress={refresh}>
          <Text style={styles.refreshLabel}>Refresh</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.error}>{error.message}</Text>}
      {loading && <Text style={styles.placeholder}>Đang tải danh sách…</Text>}
      {(data?.members ?? []).map((member) => (
        <View key={member.id} style={styles.memberCard}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRole}>{member.role}</Text>
        </View>
      ))}
      <Pressable style={styles.inviteButton} onPress={() => router.push('/(drawer)/family/invite')}>
        <Text style={styles.inviteLabel}>Invite</Text>
      </Pressable>
      <View style={styles.invites}>
        <Text style={styles.inviteTitle}>Pending invites</Text>
        {(data?.invites ?? []).map((invite) => (
          <Text key={invite.id} style={styles.inviteItem}>
            {invite.email}
          </Text>
        ))}
      </View>
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
  error: {
    color: colors.danger
  },
  placeholder: {
    color: colors.textSecondary
  },
  memberCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg
  },
  memberName: {
    fontWeight: '600',
    color: colors.textPrimary
  },
  memberRole: {
    color: colors.textSecondary
  },
  inviteButton: {
    padding: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary
  },
  inviteLabel: {
    color: '#fff',
    fontWeight: '700'
  },
  invites: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    borderRadius: spacing.lg,
    gap: spacing.xs
  },
  inviteTitle: {
    fontWeight: '600',
    color: colors.textPrimary
  },
  inviteItem: {
    color: colors.textSecondary
  }
});
