import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { Screen } from '../../src/components/Screen';
import { SelectInput } from '../../src/components/SelectInput';
import { TextInput } from '../../src/components/TextInput';
import { useAuthStore } from '../../src/features/auth/auth.store';
import { logsApi } from '../../src/features/logs/logs.api';
import { logsService } from '../../src/features/logs/logs.service';
import { useLogsStore } from '../../src/features/logs/logs.store';
import { spacing } from '../../src/styles';
import { colors } from '../../src/styles/theme';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';

// Enum options cho glucose context
const GLUCOSE_CONTEXT_OPTIONS = [
  { label: 'Khi đói (sáng)', value: 'fasting' },
  { label: 'Trước ăn', value: 'pre_meal' },
  { label: 'Sau ăn (2h)', value: 'post_meal' },
  { label: 'Trước ngủ', value: 'before_sleep' },
  { label: 'Ngẫu nhiên', value: 'random' },
];

export default function GlucoseLogScreen() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [context, setContext] = useState('pre_meal');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const createGlucose = useLogsStore((state) => state.createGlucose);
  const profile = useAuthStore((state) => state.profile);
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  // Fetch latest log to pre-fill form
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latest = await logsApi.fetchLatestByType('glucose');
        if (latest && latest.value) {
          setValue(String(latest.value));
          if (latest.context) {
            setContext(latest.context);
          }
        }
      } catch {
        // Ignore error, use default values
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatest();
  }, []);

  const handleBack = useCallback(() => router.back(), [router]);

  const handleSubmit = async () => {
    // Validate
    if (!value || isNaN(parseFloat(value))) {
      setErrors({ value: 'Vui lòng nhập giá trị hợp lệ' });
      return;
    }
    setErrors({});
    
    // Create payload matching GlucoseLogPayload type
    const payload = {
      value: parseFloat(value),
      context: context as 'fasting' | 'pre_meal' | 'post_meal' | 'before_sleep' | 'random',
      notes: notes || undefined
    };
    setIsSaving(true);
    try {
      await createGlucose(payload);
      
      // Real-time health monitoring ngay sau khi save
      if (profile?.id) {
        await logsService.checkHealthOnLog(
          profile.id.toString(),
          'glucose',
          { value: payload.value }
        );
      }
      
      setIsSaving(false);
      // Show success message
      Alert.alert(
        'Thành công!',
        'Ghi nhật ký thành công!',
        [
          {
            text: 'OK'
          }
        ]
      );
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Lưu thất bại', 'Vui lòng thử lại!');
    }
  };

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      presentation: 'modal' as const,
      title: 'Ghi chỉ số',
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      ),
    }),
    [handleBack]
  );

  const keyboardAvoidingStyle = useMemo(() => ({ flex: 1 }), []);
  const scrollContentStyle = useMemo(
    () => [styles.container, { paddingTop: padTop }],
    [padTop]
  );

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <Screen>
        <LoadingOverlay visible={isSaving} message="Đang ghi nhật ký..." />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={keyboardAvoidingStyle}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={scrollContentStyle}
              keyboardShouldPersistTaps="handled"
            >
              <H1SectionHeader title="Đường huyết" subtitle="Ghi nhanh" />
              <TextInput label="Giá trị (mg/dL)" keyboardType="numeric" value={value} onChangeText={setValue} error={errors.value} />
              <SelectInput 
                label="Thời điểm đo" 
                value={context} 
                options={GLUCOSE_CONTEXT_OPTIONS}
                onSelect={setContext}
                placeholder="Chọn thời điểm"
              />
              <TextInput label="Ghi chú" value={notes} onChangeText={setNotes} multiline />
              <Button label="Lưu" onPress={handleSubmit} disabled={isSaving} />
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: colors.background
  },
  headerTitle: {
    color: colors.textPrimary
  },
  headerLeft: {
    marginLeft: 0,
    padding: 10
  }
});
