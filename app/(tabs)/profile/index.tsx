import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/features/auth/auth.store';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';
import { Button } from '../../../src/components/Button';
import { Screen } from '../../../src/components/Screen';
import { colors, spacing, typography } from '../../../src/styles';
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from '../../../src/lib/links';

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  const name = profile?.name?.trim() ?? '';
  const phone = profile?.phone?.trim() ?? '';
  const hasProfile = Boolean(profile);
  const identityTitle = hasProfile
    ? name || 'Chưa cập nhật'
    : phone
      ? 'Khách hàng mới'
      : 'Chưa đăng nhập';
  const statusText = hasProfile ? 'Đang hoạt động' : 'Chưa đăng nhập';

  const handleEditProfile = () => {
    Alert.alert('Tính năng sẽ có trong bản sau');
  };

  const lastGlucose = '';
  const lastBloodPressure = '';
  const todayTasks = '';

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: padTop }]}>
        <H1SectionHeader title="Tài khoản" />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{identityTitle}</Text>
          {hasProfile ? (
            <>
              <Text style={styles.cardRow}>Họ tên: {name || 'Chưa cập nhật'}</Text>
              <Text style={[styles.cardRow, { marginTop: spacing.sm }]}>Số điện thoại: {phone || 'Chưa cập nhật'}</Text>
            </>
          ) : phone ? (
            <Text style={styles.cardRow}>Số điện thoại: {phone}</Text>
          ) : null}
          <Text style={[styles.cardStatus, !hasProfile && styles.cardStatusMuted]}>{statusText}</Text>
        </View>

        <H1SectionHeader title="Tùy chọn" />
        <Button label="Mở cài đặt" variant="warning" onPress={() => router.push('/settings')} />
        <Button
          label="Chỉnh sửa hồ sơ"
          variant="secondary"
          onPress={handleEditProfile}
          style={{ marginTop: spacing.md }}
        />

        <H1SectionHeader title="Tổng quan sức khỏe" />
        <View style={styles.card}>
          <Text style={styles.cardRow}>Đường huyết gần nhất: {lastGlucose}</Text>
          <Text style={[styles.cardRow, { marginTop: spacing.sm }]}>Huyết áp gần nhất: {lastBloodPressure}</Text>
          <Text style={[styles.cardRow, { marginTop: spacing.sm }]}>Nhiệm vụ hôm nay: {todayTasks}</Text>
        </View>

        <H1SectionHeader title="Tài khoản demo" />
        <View style={styles.card}>
          <Text style={styles.cardRow}>{`${DEMO_ACCOUNT_EMAIL} / ${DEMO_ACCOUNT_PASSWORD}`}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  cardRow: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  cardStatus: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.success,
    fontWeight: '600'
  },
  cardStatusMuted: {
    color: colors.textSecondary
  }
});
