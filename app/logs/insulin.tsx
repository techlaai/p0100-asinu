import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { TextInput } from '../../src/components/TextInput';
import { Toast } from '../../src/components/Toast';
import { logsApi } from '../../src/features/logs/logs.api';
import { useLogsStore } from '../../src/features/logs/logs.store';
import { validateInsulinPayload } from '../../src/features/logs/logs.validation';
import { spacing } from '../../src/styles';
import { colors } from '../../src/styles/theme';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';

export default function InsulinLogScreen() {
  const router = useRouter();
  const [insulinType, setInsulinType] = useState('');
  const [dose, setDose] = useState('');
  const [timing, setTiming] = useState('');
  const [injectionSite, setInjectionSite] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(true);
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
    try {
      await createInsulin(payload);
      setToastMessage('Đã lưu thành công!');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      setToastMessage('Lưu thất bại. Vui lòng thử lại!');
      setToastType('error');
      setShowToast(true);
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
        <Toast visible={showToast} message={toastMessage} type={toastType} onHide={() => setShowToast(false)} />
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
              <TextInput label="Loại insulin" value={insulinType} onChangeText={setInsulinType} placeholder="VD: NovoRapid, Lantus" />
              <TextInput label="Liều lượng (đơn vị)" keyboardType="numeric" value={dose} onChangeText={setDose} error={errors.dose_units} />
              <TextInput label="Thời điểm" value={timing} onChangeText={setTiming} placeholder="VD: Trước ăn, Sau ăn, Trước ngủ" />
              <TextInput label="Vị trí tiêm" value={injectionSite} onChangeText={setInjectionSite} placeholder="VD: Bụng, Đùi, Cánh tay" />
              <TextInput label="Ghi chú" value={notes} onChangeText={setNotes} multiline />
              {errors.dose_units ? <Text style={styles.error}>{errors.dose_units}</Text> : null}
              <Button label="Lưu" onPress={handleSubmit} />
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
