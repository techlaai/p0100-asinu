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
import { validateBloodPressurePayload } from '../../src/features/logs/logs.validation';
import { spacing } from '../../src/styles';
import { colors } from '../../src/styles/theme';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';

export default function BloodPressureLogScreen() {
  const router = useRouter();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [tags, setTags] = useState('Sau tập');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(true);
  const createBloodPressure = useLogsStore((state) => state.createBloodPressure);
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  // Fetch latest log to pre-fill form
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latest = await logsApi.fetchLatestByType('bp');
        if (latest) {
          if (latest.systolic) setSystolic(String(latest.systolic));
          if (latest.diastolic) setDiastolic(String(latest.diastolic));
          if (latest.tags && latest.tags.length > 0) {
            setTags(latest.tags.join(', '));
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
    const result = validateBloodPressurePayload(systolic, diastolic, tags.split(',').map((t) => t.trim()), notes);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    try {
      await createBloodPressure(result.value);
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
              <H1SectionHeader title="Huyết áp" subtitle="Ghi nhanh" />
              <TextInput label="Tâm thu (mmHg)" keyboardType="numeric" value={systolic} onChangeText={setSystolic} error={errors.bp} />
              <TextInput label="Tâm trương (mmHg)" keyboardType="numeric" value={diastolic} onChangeText={setDiastolic} error={errors.bp} />
              <TextInput label="Nhịp tim (bpm)" keyboardType="numeric" value={pulse} onChangeText={setPulse} placeholder="Tùy chọn" />
              <TextInput label="Tags" value={tags} onChangeText={setTags} placeholder="Sau tập, Sáng" />
              <TextInput label="Ghi chú" value={notes} onChangeText={setNotes} multiline />
              {errors.bp ? <Text style={styles.error}>{errors.bp}</Text> : null}
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
