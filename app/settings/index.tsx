import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { useAuthStore } from '../../src/features/auth/auth.store';
import { colors, spacing, typography } from '../../src/styles';

export default function SettingsScreen() {
  const logout = useAuthStore((state) => state.logout);
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xác nhận xóa?',
      'Hành động này không thể hoàn tác. Mọi dữ liệu sức khỏe sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Yêu cầu đã được ghi nhận. Hệ thống sẽ xử lý trong 24h.'
            );
          }
        }
      ]
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: padTop }]}>
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

        <Button label="Đăng xuất" variant="warning" onPress={handleLogout} style={{ marginTop: spacing.xl }} />
        <Button
          label="Xóa tài khoản"
          variant="ghost"
          onPress={handleDeleteAccount}
          style={{ marginTop: spacing.md, borderColor: colors.danger }}
          textStyle={{ color: colors.danger }}
        />
        <Text style={styles.versionText}>v0.9.1 (Build: Preview)</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.background
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
  },
  versionText: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    width: '100%'
  }
});
