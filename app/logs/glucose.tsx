import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { TextInput } from '../../src/components/TextInput';
import { Toast } from '../../src/components/Toast';
import { logsApi } from '../../src/features/logs/logs.api';
import { useLogsStore } from '../../src/features/logs/logs.store';
import { validateGlucosePayload } from '../../src/features/logs/logs.validation';
import { spacing } from '../../src/styles';
import { colors } from '../../src/styles/theme';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';

export default function GlucoseLogScreen() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [tags, setTags] = useState('Trước ăn');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(true);
  const createGlucose = useLogsStore((state) => state.createGlucose);
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  // Fetch latest log to pre-fill form
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latest = await logsApi.fetchLatestByType('glucose');
        if (latest && latest.value) {
          setValue(String(latest.value));
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
    const result = validateGlucosePayload(value, tags.split(',').map((t) => t.trim()), notes);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    try {
      await createGlucose(result.value);
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

  const keyboardAvoidingStyle = useMemo(() => ({ flex: 1 }), []);
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
              <TextInput label="Tags" value={tags} onChangeText={setTags} placeholder="Trước ăn, Sau ăn" />
              <TextInput label="Ghi chú" value={notes} onChangeText={setNotes} multiline />
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
  }
});
