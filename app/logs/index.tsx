import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListItem } from '../../src/components/ListItem';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { Screen } from '../../src/components/Screen';
import { StateError } from '../../src/components/state/StateError';
import { StateLoading } from '../../src/components/state/StateLoading';
import { useLogsStore } from '../../src/features/logs/logs.store';
import { spacing } from '../../src/styles';
import { colors } from '../../src/styles/theme';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';

export default function LogsIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;
  const fetchLogs = useLogsStore((state) => state.fetchRecent);
  const status = useLogsStore((state) => state.status);
  const errorState = useLogsStore((state) => state.errorState);
  const isStale = useLogsStore((state) => state.isStale);

  useEffect(() => {
    if (status === 'idle') {
      const controller = new AbortController();
      fetchLogs(controller.signal);
      return () => controller.abort();
    }
  }, [status, fetchLogs]);

  const handleRefresh = useCallback(() => {
    const controller = new AbortController();
    fetchLogs(controller.signal);
  }, [fetchLogs]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true, // Bắt buộc hiện Header
          presentation: 'modal', // Hiệu ứng trượt lên
          title: 'Ghi chỉ số', // (Hoặc giữ nguyên title cũ nếu có)
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.textPrimary },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 0, padding: 10 }}>
              {/* Dùng Icon mũi tên, size 28 cho dễ bấm, màu đen cho tương phản tốt */}
              <Ionicons name="arrow-back" size={28} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Screen>
        {isStale || errorState === 'remote-failed' ? <OfflineBanner /> : null}
        {status === 'loading' ? <StateLoading /> : null}
        {errorState === 'no-data' ? <StateError onRetry={() => fetchLogs()} message="Không tải dữ liệu được" /> : null}
        <ScrollView 
          contentContainerStyle={[styles.container, { paddingTop: padTop }]}
          refreshControl={
            <RefreshControl
              refreshing={status === 'loading'}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <H1SectionHeader title="Ghi nhật ký" subtitle="Chọn loại ghi" />
          <ListItem title="Đường huyết" onPress={() => router.push('/logs/glucose')} />
          <ListItem title="Huyết áp" onPress={() => router.push('/logs/blood-pressure')} style={{ marginTop: spacing.md }} />
          <ListItem title="Thuốc/Insulin" onPress={() => router.push('/logs/medication')} style={{ marginTop: spacing.md }} />
          <ListItem title="Insulin" onPress={() => router.push('/logs/insulin')} style={{ marginTop: spacing.md }} />
          <ListItem title="Bữa ăn" onPress={() => router.push('/logs/meal')} style={{ marginTop: spacing.md }} />
          <ListItem title="Nước uống" onPress={() => router.push('/logs/water')} style={{ marginTop: spacing.md }} />
          <ListItem title="Cân nặng" onPress={() => router.push('/logs/weight')} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md
  }
});
