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
import { spacing } from '../../src/styles';
import { colors } from '../../src/styles/theme';
import { H1SectionHeader } from '../../src/ui-kit/H1SectionHeader';

// Options cho loại bữa ăn
const MEAL_TYPE_OPTIONS = [
  { label: 'Bữa sáng', value: 'breakfast' },
  { label: 'Bữa trưa', value: 'lunch' },
  { label: 'Bữa tối', value: 'dinner' },
  { label: 'Ăn vặt', value: 'snack' },
  { label: 'Ăn khuya', value: 'midnight' },
];

export default function MealLogScreen() {
  const router = useRouter();
  const [mealType, setMealType] = useState('breakfast');
  const [kcal, setKcal] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [fatG, setFatG] = useState('');
  const [notes, setNotes] = useState('');
  const [photoKey, setPhotoKey] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const createMeal = useLogsStore((state) => state.createMeal);
  const insets = useSafeAreaInsets();
  const padTop = insets.top + spacing.lg;

  // Fetch latest log to pre-fill form
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latest = await logsApi.fetchLatestByType('meal');
        if (latest) {
          if (latest.title) setMealType(latest.title);
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

  // Get display label for meal type
  const getMealLabel = (value: string) => {
    const option = MEAL_TYPE_OPTIONS.find(opt => opt.value === value);
    return option?.label || value;
  };

  const handleSubmit = async () => {
    // Validate
    if (!mealType) {
      setErrors({ title: 'Vui lòng chọn loại bữa ăn' });
      return;
    }
    setErrors({});
    
    // Create payload matching MealLogPayload type
    const payload = {
      title: getMealLabel(mealType),
      kcal: kcal ? parseFloat(kcal) : undefined,
      carbs_g: carbsG ? parseFloat(carbsG) : undefined,
      protein_g: proteinG ? parseFloat(proteinG) : undefined,
      fat_g: fatG ? parseFloat(fatG) : undefined,
      photo_key: photoKey || undefined,
      notes: notes || undefined
    };
    setIsSaving(true);
    try {
      await createMeal(payload);
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
              <H1SectionHeader title="Bữa ăn" subtitle="Ghi nhanh" />
              <SelectInput 
                label="Loại bữa" 
                value={mealType} 
                options={MEAL_TYPE_OPTIONS}
                onSelect={setMealType}
                placeholder="Chọn loại bữa ăn"
              />
              <TextInput label="Năng lượng (kcal)" keyboardType="numeric" value={kcal} onChangeText={setKcal} placeholder="Tùy chọn" error={errors.kcal} />
              <TextInput label="Tinh bột (g)" keyboardType="numeric" value={carbsG} onChangeText={setCarbsG} placeholder="Tùy chọn" />
              <TextInput label="Đạm (g)" keyboardType="numeric" value={proteinG} onChangeText={setProteinG} placeholder="Tùy chọn" />
              <TextInput label="Chất béo (g)" keyboardType="numeric" value={fatG} onChangeText={setFatG} placeholder="Tùy chọn" />
              <TextInput label="Ghi chú" value={notes} onChangeText={setNotes} multiline />
              {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}
              {errors.kcal ? <Text style={styles.error}>{errors.kcal}</Text> : null}
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
