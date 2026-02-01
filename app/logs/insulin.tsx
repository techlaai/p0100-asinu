import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { Screen } from '../../src/components/Screen';
import { SelectInput } from '../../src/components/SelectInput';
import { TextInput } from '../../src/components/TextInput';
import { logsApi } from '../../src/features/logs/logs.api';
import { useLogsStore } from '../../src/features/logs/logs.store';
import { validateInsulinPayload } from '../../src/features/logs/logs.validation';
import { spacing } from '../../src/styles';
import { colors } from '../../src/styles/theme';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';

// Enum options cho insulin timing
const INSULIN_TIMING_OPTIONS = [
  { label: 'Trước ăn', value: 'pre_meal' },
  { label: 'Sau ăn', value: 'post_meal' },
  { label: 'Trước ngủ', value: 'bedtime' },
  { label: 'Điều chỉnh', value: 'correction' },
];

// Options cho loại insulin
const INSULIN_TYPE_OPTIONS = [
  { label: 'NovoRapid (Nhanh)', value: 'NovoRapid' },
  { label: 'Humalog (Nhanh)', value: 'Humalog' },
  { label: 'Apidra (Nhanh)', value: 'Apidra' },
  { label: 'Lantus (Chậm)', value: 'Lantus' },
  { label: 'Levemir (Chậm)', value: 'Levemir' },
  { label: 'Tresiba (Siêu chậm)', value: 'Tresiba' },
  { label: 'Khác', value: 'other' },
];

// Options cho vị trí tiêm
const INJECTION_SITE_OPTIONS = [
  { label: 'Bụng', value: 'abdomen' },
  { label: 'Đùi', value: 'thigh' },
  { label: 'Cánh tay', value: 'arm' },
  { label: 'Mông', value: 'buttock' },
];

export default function InsulinLogScreen() {
  const router = useRouter();
  const [insulinType, setInsulinType] = useState('');
  const [dose, setDose] = useState('');
  const [timing, setTiming] = useState('pre_meal');
  const [injectionSite, setInjectionSite] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const createInsulin = useLogsStore((state) => state.createInsulin);
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  // Fetch latest log to pre-fill form
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latest = await logsApi.fetchLatestByType('insulin');
        if (latest) {
          if (latest.insulin_type) setInsulinType(latest.insulin_type);
          if (latest.dose_units) setDose(String(latest.dose_units));
          if (latest.timing) setTiming(latest.timing);
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
    const result = validateInsulinPayload(insulinType, dose, undefined, notes);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    // Add timing to payload
    const payload = {
      ...result.value,
      timing: timing || undefined
    };
    setErrors({});
    setIsSaving(true);
    try {
      await createInsulin(payload);
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
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={scrollContentStyle} keyboardShouldPersistTaps="handled">
              <H1SectionHeader title="Insulin" subtitle="Ghi nhanh" />
              <SelectInput 
                label="Loại insulin" 
                value={insulinType} 
                options={INSULIN_TYPE_OPTIONS}
                onSelect={setInsulinType}
                placeholder="Chọn loại insulin"
              />
              <TextInput label="Liều lượng (đơn vị)" keyboardType="numeric" value={dose} onChangeText={setDose} error={errors.dose_units} />
              <SelectInput 
                label="Thời điểm" 
                value={timing} 
                options={INSULIN_TIMING_OPTIONS}
                onSelect={setTiming}
                placeholder="Chọn thời điểm"
              />
              <SelectInput 
                label="Vị trí tiêm" 
                value={injectionSite} 
                options={INJECTION_SITE_OPTIONS}
                onSelect={setInjectionSite}
                placeholder="Chọn vị trí tiêm"
              />
              <TextInput label="Ghi chú" value={notes} onChangeText={setNotes} multiline />
              {errors.dose_units ? <Text style={styles.error}>{errors.dose_units}</Text> : null}
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
  },
  error: {
    color: colors.danger,
    fontWeight: '600'
  }
});
