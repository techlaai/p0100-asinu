import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { TextInput } from '../../src/components/TextInput';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/features/auth/auth.store';
import { colors, radius, spacing, typography } from '../../src/styles';

type AnswerState = {
  age: string;
  gender: string;
  goal: string;
  body_shape: string;
  checkup: string;
  conditions: string[];
  chronic: string[];
  bone_joint: string;
  bone_joint_other: string;
  flexibility: string;
  stairs: string;
  exercise: string;
  walking: string;
  water: string;
  sleep: string;
};

type StepType = 'single' | 'multi' | 'single-other';

type Step = {
  key: keyof AnswerState;
  title: string;
  options: string[];
  type: StepType;
  noneOption?: string;
  otherLabel?: string;
};

const steps: Step[] = [
  { key: 'age', title: 'M1. Tuổi', options: ['30-39', '40-49', '50-59', '60+'], type: 'single' },
  { key: 'gender', title: 'M2. Giới tính', options: ['Nam', 'Nữ'], type: 'single' },
  {
    key: 'goal',
    title: 'M3. Mục tiêu',
    options: ['Giảm cân', 'Sức khỏe & Tuổi thọ', 'Năng lượng & Sức sống', 'Thăng bằng & Khả năng vận động'],
    type: 'single'
  },
  { key: 'body_shape', title: 'M4. Dáng người', options: ['Mảnh khảnh', 'Trung bình', 'Nặng'], type: 'single' },
  {
    key: 'checkup',
    title: 'M5. Khám định kỳ',
    options: ['Dưới 6 tháng', '6-12 tháng', 'Trên 1 năm', 'Hiếm khi'],
    type: 'single'
  },
  {
    key: 'conditions',
    title: 'M6. Bệnh nền',
    options: ['Tiểu đường', 'Cao huyết áp', 'Tim mạch', 'Gút', 'Không có'],
    type: 'multi',
    noneOption: 'Không có'
  },
  {
    key: 'chronic',
    title: 'M7. Mãn tính',
    options: ['Đau đầu/Tiền đình', 'Trào ngược', 'Mất ngủ', 'Táo bón', 'Khác'],
    type: 'multi'
  },
  {
    key: 'bone_joint',
    title: 'M8. Xương khớp',
    options: ['Thoát vị đĩa đệm', 'Đau đầu gối', 'Đau lưng', 'Khác'],
    type: 'single-other',
    otherLabel: 'Nhập vấn đề xương khớp khác'
  },
  {
    key: 'flexibility',
    title: 'M9. Linh hoạt',
    options: ['Rất linh hoạt', 'Khá linh hoạt', 'Không tốt lắm', 'Tôi không chắc'],
    type: 'single'
  },
  {
    key: 'stairs',
    title: 'M10. Leo thang',
    options: ['Không nói được/hết hơi', 'Hơi thở gấp/vẫn nói được', 'Bình thường sau 1 tầng', 'Xử lý nhiều tầng'],
    type: 'single'
  },
  {
    key: 'exercise',
    title: 'M11. Tập luyện',
    options: ['Không có gì', '1-2 lần/tuần', '3 lần/tuần', 'Hơn 3 lần/tuần'],
    type: 'single'
  },
  {
    key: 'walking',
    title: 'M12. Đi dạo',
    options: ['Mỗi ngày', '3-4 lần/tuần', '1-2 lần/tuần', 'Hàng tháng'],
    type: 'single'
  },
  {
    key: 'water',
    title: 'M13. Uống nước',
    options: ['Ít hơn 2 ly', '2-6 ly', '7-10 ly', 'Hơn 10 ly'],
    type: 'single'
  },
  {
    key: 'sleep',
    title: 'M14. Ngủ',
    options: ['Dưới 5 tiếng', '5-6 tiếng', '7-8 tiếng', 'Hơn 8 tiếng'],
    type: 'single'
  }
];

export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<AnswerState>({
    age: '',
    gender: '',
    goal: '',
    body_shape: '',
    checkup: '',
    conditions: [],
    chronic: [],
    bone_joint: '',
    bone_joint_other: '',
    flexibility: '',
    stairs: '',
    exercise: '',
    walking: '',
    water: '',
    sleep: ''
  });

  const profile = useAuthStore((state) => state.profile);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];

  const progress = useMemo(() => (stepIndex + 1) / totalSteps, [stepIndex, totalSteps]);

  const isStepValid = useMemo(() => {
    const value = answers[currentStep.key];
    if (currentStep.type === 'multi') {
      return Array.isArray(value) && value.length > 0;
    }
    if (typeof value !== 'string' || value.trim().length === 0) return false;
    if (currentStep.type === 'single-other' && value === 'Khác') {
      return answers.bone_joint_other.trim().length > 0;
    }
    return true;
  }, [answers, currentStep]);

  const toggleMulti = (key: keyof AnswerState, value: string, noneOption?: string) => {
    setAnswers((prev) => {
      const current = (prev[key] as string[]) || [];
      let next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      if (noneOption) {
        if (value === noneOption) {
          next = [noneOption];
        } else {
          next = next.filter((item) => item !== noneOption);
        }
      }
      return { ...prev, [key]: next };
    });
  };

  const selectSingle = (key: keyof AnswerState, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'bone_joint' && value !== 'Khác' ? { bone_joint_other: '' } : {})
    }));
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((idx) => Math.max(0, idx - 1));
  };

  const handleSubmit = async () => {
    const userId = profile?.id;
    if (!userId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng đăng nhập lại.');
      router.replace('/login');
      return;
    }

    const boneJointValue =
      answers.bone_joint === 'Khác'
        ? `Khác: ${answers.bone_joint_other.trim()}`
        : answers.bone_joint;

    const payload = {
      user_id: userId,
      profile: {
        age: answers.age,
        gender: answers.gender,
        goal: answers.goal,
        body_shape: answers.body_shape,
        checkup: answers.checkup,
        conditions: answers.conditions,
        chronic: answers.chronic,
        bone_joint: boneJointValue,
        flexibility: answers.flexibility,
        stairs: answers.stairs,
        exercise: answers.exercise,
        walking: answers.walking,
        water: answers.water,
        sleep: answers.sleep
      }
    };

    setSubmitting(true);
    try {
      await apiClient('/api/mobile/onboarding', { method: 'POST', body: payload });
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Không thể gửi dữ liệu', 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!isStepValid) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn câu trả lời trước khi tiếp tục.');
      return;
    }

    if (stepIndex < totalSteps - 1) {
      setStepIndex((idx) => idx + 1);
      return;
    }

    await handleSubmit();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>Bước {stepIndex + 1}/{totalSteps}</Text>
        </View>

        <Text style={styles.header}>Khảo sát nhanh</Text>
        <Text style={styles.subtitle}>14 bước ngắn để cá nhân hóa hành trình</Text>

        <View style={styles.card}>
          <Text style={styles.question}>{currentStep.title}</Text>
          <View style={styles.options}>
            {currentStep.options.map((option) => {
              const value = answers[currentStep.key];
              const active = Array.isArray(value) ? value.includes(option) : value === option;
              return (
                <Pressable
                  key={option}
                  onPress={() =>
                    currentStep.type === 'multi'
                      ? toggleMulti(currentStep.key, option, currentStep.noneOption)
                      : selectSingle(currentStep.key, option)
                  }
                  android_ripple={{ color: colors.primary + '22' }}
                  style={({ pressed }) => [
                    styles.optionCard,
                    active && styles.optionCardActive,
                    pressed && styles.optionCardPressed
                  ]}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          {currentStep.type === 'single-other' && answers.bone_joint === 'Khác' ? (
            <TextInput
              label={currentStep.otherLabel}
              value={answers.bone_joint_other}
              onChangeText={(value) => setAnswers((prev) => ({ ...prev, bone_joint_other: value }))}
              placeholder="Nhập chi tiết"
            />
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label="Quay lại" variant="ghost" onPress={handleBack} disabled={stepIndex === 0 || submitting} />
        <Button
          label={stepIndex === totalSteps - 1 ? 'Hoàn tất' : 'Tiếp tục'}
          onPress={handleNext}
          disabled={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg
  },
  progressWrap: {
    gap: spacing.sm
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary
  },
  progressText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary
  },
  header: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    color: colors.textPrimary
  },
  subtitle: {
    color: colors.textSecondary
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md
  },
  question: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary
  },
  options: {
    gap: spacing.sm
  },
  optionCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '14'
  },
  optionCardPressed: {
    opacity: 0.9
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: typography.size.md,
    fontWeight: '600',
    fontFamily: 'System'
  },
  optionTextActive: {
    color: colors.primary
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  }
});
