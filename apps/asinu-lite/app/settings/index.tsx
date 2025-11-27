import { ScrollView, StyleSheet, Text, View, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';
import { Button } from '../../src/components/Button';
import { colors, spacing, typography } from '../../src/styles';
import { useAuthStore } from '../../src/features/auth/auth.store';

export default function SettingsScreen() {
  const logout = useAuthStore((state) => state.logout);
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <H1SectionHeader title="Cài đặt" />
      <View style={styles.row}>
        <View>
          <Text style={styles.title}>Thông báo</Text>
          <Text style={styles.subtitle}>Nhận nhắc nhở log</Text>
        </View>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>
      <View style={styles.row}>
        <View>
          <Text style={styles.title}>Nhắc nhiệm vụ</Text>
          <Text style={styles.subtitle}>Nhận push khi gần hết ngày</Text>
        </View>
        <Switch value={reminders} onValueChange={setReminders} />
      </View>
      <Button label="Đăng xuất" onPress={handleLogout} style={{ marginTop: spacing.xl }} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: '700'
  },
  subtitle: {
    color: colors.textSecondary
  }
});
