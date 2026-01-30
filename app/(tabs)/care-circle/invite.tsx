import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/Button';
import { Screen } from '../../../src/components/Screen';
import { TextInput } from '../../../src/components/TextInput';
import { useCareCircle } from '../../../src/features/care-circle';
import { colors, spacing, typography } from '../../../src/styles';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';

export default function InviteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createInvitation, loading } = useCareCircle();

  const [addresseeId, setAddresseeId] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [role, setRole] = useState('');
  const [permissions, setPermissions] = useState({
    can_view_logs: false,
    can_receive_alerts: false,
    can_ack_escalation: false
  });

  const handleSend = async () => {
    if (!addresseeId.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập ID người nhận');
      return;
    }

    try {
      await createInvitation({
        addressee_id: addresseeId,
        relationship_type: relationshipType || undefined,
        role: role || undefined,
        permissions
      });
      Alert.alert('Thành công', 'Lời mời đã được gửi', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi lời mời');
    }
  };

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl }}
      >
        <View style={styles.header}>
          <H1SectionHeader title="Mời kết nối" />
          <Text style={styles.subtitle}>Thêm người thân hoặc người chăm sóc vào vòng kết nối</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>ID người nhận *</Text>
          <TextInput
            value={addresseeId}
            onChangeText={setAddresseeId}
            placeholder="Nhập ID của người bạn muốn mời"
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Mối quan hệ</Text>
          <TextInput
            value={relationshipType}
            onChangeText={setRelationshipType}
            placeholder="VD: Con trai, Con gái, Vợ, Chồng..."
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Vai trò</Text>
          <TextInput
            value={role}
            onChangeText={setRole}
            placeholder="VD: Người chăm sóc, Bác sĩ..."
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quyền truy cập</Text>
          
          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Xem nhật ký sức khỏe</Text>
              <Text style={styles.permissionDesc}>Cho phép xem các chỉ số và nhật ký</Text>
            </View>
            <Switch
              value={permissions.can_view_logs}
              onValueChange={(value) =>
                setPermissions({ ...permissions, can_view_logs: value })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Nhận cảnh báo</Text>
              <Text style={styles.permissionDesc}>Nhận thông báo khi có vấn đề sức khỏe</Text>
            </View>
            <Switch
              value={permissions.can_receive_alerts}
              onValueChange={(value) =>
                setPermissions({ ...permissions, can_receive_alerts: value })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Xác nhận cảnh báo</Text>
              <Text style={styles.permissionDesc}>Có thể xác nhận và xử lý cảnh báo</Text>
            </View>
            <Switch
              value={permissions.can_ack_escalation}
              onValueChange={(value) =>
                setPermissions({ ...permissions, can_ack_escalation: value })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Button 
            label={loading ? 'Đang gửi...' : 'Gửi lời mời'}
            onPress={handleSend} 
            disabled={loading}
          />
          <Button
            label="Hủy"
            variant="secondary"
            onPress={() => router.back()}
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  input: {
    marginBottom: 0
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  permissionInfo: {
    flex: 1,
    marginRight: spacing.md
  },
  permissionTitle: {
    fontSize: typography.size.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2
  },
  permissionDesc: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  cancelButton: {
    marginTop: spacing.sm
  }
});
