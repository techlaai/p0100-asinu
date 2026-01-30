import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/Button';
import { Screen } from '../../../src/components/Screen';
import { useAuthStore } from '../../../src/features/auth/auth.store';
import { useCareCircle } from '../../../src/features/care-circle';
import { colors, spacing, typography } from '../../../src/styles';
import { H1SectionHeader } from '../../../src/ui-kit/H1SectionHeader';

export default function CareCircleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((state) => state.profile);
  
  const {
    invitations,
    connections,
    loading,
    refreshing,
    fetchInvitations,
    fetchConnections,
    acceptInvitation,
    rejectInvitation,
    deleteConnection,
    refresh
  } = useCareCircle();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
    fetchConnections();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      setActionLoading(id);
      await acceptInvitation(id);
      Alert.alert('Thành công', 'Đã chấp nhận lời mời');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      await rejectInvitation(id);
      Alert.alert('Đã từ chối', 'Lời mời đã bị từ chối');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể từ chối lời mời');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConnection = async (id: string, name: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa kết nối với ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(id);
              await deleteConnection(id);
              Alert.alert('Đã xóa', 'Kết nối đã được xóa');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa kết nối');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const receivedInvitations = invitations.filter(
    (inv) => inv.addressee_id === profile?.id && inv.status === 'pending'
  );
  const sentInvitations = invitations.filter(
    (inv) => inv.requester_id === profile?.id && inv.status === 'pending'
  );

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.header}>
          <H1SectionHeader title="Vòng kết nối" />
          <Text style={styles.subtitle}>Quản lý người thân và người chăm sóc</Text>
        </View>

        <View style={styles.section}>
          <Button
            label="+ Mời người mới"
            onPress={() => router.push('/care-circle/invite')}
            style={styles.inviteButton}
          />
        </View>

        {/* Received Invitations */}
        {receivedInvitations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lời mời đã nhận ({receivedInvitations.length})</Text>
            {receivedInvitations.map((invitation) => (
              <View key={invitation.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {invitation.requester_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>
                      {invitation.requester_name || `User ${invitation.requester_id}`}
                    </Text>
                    <Text style={styles.cardRelation}>
                      {invitation.relationship_type || invitation.role || 'Kết nối'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAccept(invitation.id)}
                    disabled={actionLoading === invitation.id}
                  >
                    {actionLoading === invitation.id ? (
                      <ActivityIndicator size="small" color={colors.surface} />
                    ) : (
                      <Text style={styles.acceptButtonText}>Chấp nhận</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(invitation.id)}
                    disabled={actionLoading === invitation.id}
                  >
                    <Text style={styles.rejectButtonText}>Từ chối</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sent Invitations */}
        {sentInvitations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lời mời đã gửi ({sentInvitations.length})</Text>
            {sentInvitations.map((invitation) => (
              <View key={invitation.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {invitation.addressee_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>
                      {invitation.addressee_name || `User ${invitation.addressee_id}`}
                    </Text>
                    <Text style={styles.cardStatus}>Đang chờ phản hồi...</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Active Connections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Kết nối đang hoạt động ({connections.length})
          </Text>
          {loading && connections.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : connections.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có kết nối nào</Text>
              <Text style={styles.emptySubtext}>Mời người thân hoặc người chăm sóc để bắt đầu</Text>
            </View>
          ) : (
            connections.map((connection) => {
              const isRequester = connection.requester_id === profile?.id;
              const otherUserId = isRequester ? connection.addressee_id : connection.requester_id;
              const otherUserName = isRequester ? connection.addressee_name : connection.requester_name;

              return (
                <View key={connection.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {otherUserName?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>
                        {otherUserName || `User ${otherUserId}`}
                      </Text>
                      <Text style={styles.cardRelation}>
                        {connection.relationship_type || connection.role || 'Kết nối'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteConnection(connection.id, otherUserName || 'người này')}
                    disabled={actionLoading === connection.id}
                  >
                    {actionLoading === connection.id ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <Text style={styles.deleteButtonText}>Xóa</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
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
  inviteButton: {
    backgroundColor: colors.primary
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.surface
  },
  cardInfo: {
    flex: 1
  },
  cardName: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2
  },
  cardRelation: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  cardStatus: {
    fontSize: typography.size.sm,
    color: colors.warning,
    fontStyle: 'italic'
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40
  },
  acceptButton: {
    backgroundColor: colors.primary
  },
  acceptButtonText: {
    color: colors.surface,
    fontSize: typography.size.sm,
    fontWeight: '600'
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border
  },
  rejectButtonText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: '600'
  },
  deleteButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    minHeight: 40,
    justifyContent: 'center'
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: typography.size.sm,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  loader: {
    marginVertical: spacing.xl
  }
});
