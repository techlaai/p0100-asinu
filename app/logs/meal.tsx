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
import { validateMealPayload } from '../../src/features/logs/logs.validation';
import { spacing } from '../../src/styles';
import { colors } from '../../src/styles/theme';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';

export default function MealLogScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [kcal, setKcal] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [fatG, setFatG] = useState('');
  const [notes, setNotes] = useState('');
  const [photoKey, setPhotoKey] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(true);
  const createMeal = useLogsStore((state) => state.createMeal);
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  // Fetch latest log to pre-fill form
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latest = await logsApi.fetchLatestByType('meal');
        if (latest) {
          if (latest.title) setTitle(latest.title);
          if (latest.kcal) setKcal(String(latest.kcal));
          if (latest.carbs_g) setCarbsG(String(latest.carbs_g));
          if (latest.protein_g) setProteinG(String(latest.protein_g));
          if (latest.fat_g) setFatG(String(latest.fat_g));
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
    const result = validateMealPayload(title, kcal, photoKey, notes);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    // Add carbs, protein, fat to payload
    const payload = {
      ...result.value,
      carbs_g: carbsG ? parseFloat(carbsG) : undefined,
      protein_g: proteinG ? parseFloat(proteinG) : undefined,
      fat_g: fatG ? parseFloat(fatG) : undefined
    };
    setErrors({});
    try {
      await createMeal(payload);
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
              <H1SectionHeader title="Bữa ăn" subtitle="Ghi nhanh" />
              <TextInput label="Tên bữa" value={title} onChangeText={setTitle} placeholder="VD: Bữa sáng" error={errors.title} />
              <TextInput label="Calories (kcal)" keyboardType="numeric" value={kcal} onChangeText={setKcal} placeholder="Tùy chọn" error={errors.kcal} />
              <TextInput label="Carbs (g)" keyboardType="numeric" value={carbsG} onChangeText={setCarbsG} placeholder="Tùy chọn" />
              <TextInput label="Protein (g)" keyboardType="numeric" value={proteinG} onChangeText={setProteinG} placeholder="Tùy chọn" />
              <TextInput label="Fat (g)" keyboardType="numeric" value={fatG} onChangeText={setFatG} placeholder="Tùy chọn" />
              <TextInput label="Photo URL" value={photoKey} onChangeText={setPhotoKey} placeholder="Tùy chọn" />
              <TextInput label="Ghi chú" value={notes} onChangeText={setNotes} multiline />
              {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}
              {errors.kcal ? <Text style={styles.error}>{errors.kcal}</Text> : null}
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
