import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../../src/features/auth/auth.store';
import { useFlagsStore } from '../../../src/features/app-config/flags.store';
import { F1ProfileSummary } from '../../../src/ui-kit/F1ProfileSummary';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';
import { ListItem } from '../../../src/components/ListItem';
import { colors, spacing } from '../../../src/styles';
import { Button } from '../../../src/components/Button';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const flags = useFlagsStore();
  const fetchFlags = useFlagsStore((state) => state.fetchFlags);
  const router = useRouter();

  useEffect(() => {
    if (flags.status === 'idle') {
      fetchFlags();
    }
  }, [flags.status, fetchFlags]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {profile ? (
        <F1ProfileSummary
          name={profile.name}
          email={profile.email}
          phone={profile.phone}
          caretakerFor={profile.relationship}
        />
      ) : null}

      <H1SectionHeader title="Tính năng" subtitle="Flags" />
      <ListItem
        title="Mood Tracker"
        subtitle={flags.FEATURE_MOOD_TRACKER ? 'Đã bật' : 'Đang tắt'}
        onPress={() => fetchFlags()}
      />
      <ListItem
        title="AI Chat"
        subtitle={flags.FEATURE_AI_CHAT ? 'Đã bật' : 'Đang tắt'}
        onPress={() => fetchFlags()}
        style={{ marginTop: spacing.md }}
      />

      <H1SectionHeader title="Tùy chọn" />
      <Button label="Mở cài đặt" variant="secondary" onPress={() => router.push('/settings')} />
      <Button label="Đăng xuất" variant="primary" onPress={handleLogout} style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.md
  },
  group: {
    gap: spacing.sm
  },
  listCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  }
});
