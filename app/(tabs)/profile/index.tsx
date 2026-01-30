import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/Button';
import { CareCircleNotificationBadge } from '../../../src/components/CareCircleNotificationBadge';
import { Screen } from '../../../src/components/Screen';
import { Toast } from '../../../src/components/Toast';
import { authApi } from '../../../src/features/auth/auth.api';
import { useAuthStore } from '../../../src/features/auth/auth.store';
import { useLogsStore } from '../../../src/features/logs/logs.store';
import { useMissionsStore } from '../../../src/features/missions/missions.store';
import { colors, spacing, typography } from '../../../src/styles';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);
  const router = useRouter();
  
  // Debug log
  console.log('[profile.screen] profile:', profile);
  console.log('[profile.screen] profile.name:', profile?.name);
  console.log('[profile.screen] profile.phone:', profile?.phone);
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  // Fetch real data from stores
  const logs = useLogsStore((state) => state.recent);
  const fetchLogs = useLogsStore((state) => state.fetchRecent);
  const missions = useMissionsStore((state) => state.missions);
  const fetchMissions = useMissionsStore((state) => state.fetchMissions);

  // Edit profile state
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Fetch data on mount
  useEffect(() => {
    const controller = new AbortController();
    fetchLogs(controller.signal);
    fetchMissions(controller.signal);
    return () => controller.abort();
  }, [fetchLogs, fetchMissions]);

  // Compute health overview from real data
  const healthOverview = useMemo(() => {
    const latestGlucose = logs.find((log) => log.type === 'glucose');
    const latestBP = logs.find((log) => log.type === 'blood-pressure');
    
    const glucoseText = latestGlucose?.value 
      ? `${latestGlucose.value} mg/dL` 
      : 'Chưa có dữ liệu';
    
    const bpText = latestBP?.systolic && latestBP?.diastolic
      ? `${latestBP.systolic}/${latestBP.diastolic} mmHg`
      : 'Chưa có dữ liệu';
    
    const activeMissions = missions.filter((m) => m.status === 'active');
    const todayTasksText = activeMissions.length > 0
      ? `${activeMissions.length} nhiệm vụ đang thực hiện`
      : 'Không có nhiệm vụ';
    
    return { glucoseText, bpText, todayTasksText };
  }, [logs, missions]);

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
    setEditName(name);
    setEditPhone(phone);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setToastMessage('Vui lòng nhập họ tên');
      setToastType('error');
      setToastVisible(true);
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('[profile.screen] Calling updateProfile API directly with:', { name: editName.trim(), phone: editPhone.trim() });
      
      // Call API directly instead of through store
      const updatedProfile = await authApi.updateProfile({ 
        name: editName.trim(), 
        phone: editPhone.trim() 
      });
      
      console.log('[profile.screen] API response:', updatedProfile);
      
      // Manually update the auth store with the returned profile
      useAuthStore.setState({ profile: updatedProfile });
      
      setEditModalVisible(false);
      setToastMessage('Cập nhật hồ sơ thành công');
      setToastType('success');
      setToastVisible(true);
    } catch (error) {
      console.error('[profile.screen] updateProfile error:', error);
      setToastMessage('Lỗi khi cập nhật hồ sơ');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const { glucoseText, bpText, todayTasksText } = healthOverview;

  return (
    <Screen>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
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

        
        {/* Care Circle Notification Badge */}
        <CareCircleNotificationBadge />
        
        <Button 
          label="Vòng kết nối" 
          variant="secondary" 
          onPress={() => router.push('/care-circle')} 
          style={styles.optionButton}
        />
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
          <Text style={styles.cardRow}>Đường huyết gần nhất: {glucoseText}</Text>
          <Text style={[styles.cardRow, { marginTop: spacing.sm }]}>Huyết áp gần nhất: {bpText}</Text>
          <Text style={[styles.cardRow, { marginTop: spacing.sm }]}>Nhiệm vụ hôm nay: {todayTasksText}</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
            
            <Text style={styles.inputLabel}>Họ tên</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nhập họ tên"
              placeholderTextColor={colors.textSecondary}
            />
            
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Nhập số điện thoại"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
            
            <View style={styles.modalButtons}>
              <Button
                label="Hủy"
                variant="ghost"
                onPress={() => setEditModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                label={isSaving ? 'Đang lưu...' : 'Lưu'}
                variant="primary"
                onPress={handleSaveProfile}
                disabled={isSaving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  },
  optionButton: {
    marginBottom: spacing.sm
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center'
  },
  inputLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: spacing.md
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.md
  }
});
