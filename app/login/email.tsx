import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { TextInput } from '../../src/components/TextInput';
import { SocialProvider } from '../../src/features/auth/auth.service';
import { useAuthStore } from '../../src/features/auth/auth.store';
import { colors, radius, spacing, typography } from '../../src/styles';

export default function LoginEmailScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email');
  const [pendingAction, setPendingAction] = useState<'email' | 'phone' | SocialProvider | null>(null);
  const login = useAuthStore((state) => state.login);
  const loginWithPhone = useAuthStore((state) => state.loginWithPhone);
  const loginWithSocial = useAuthStore((state) => state.loginWithSocial);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openLegal = (type: 'terms' | 'privacy') => {
    router.push({ pathname: '/legal/content', params: { type } });
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim() || loading) return;
    setPendingAction('email');
    try {
      await login({ email: email.trim(), password: password.trim() });
      router.replace('/(tabs)/home');
    } catch (err) {
      console.error(err);
    } finally {
      setPendingAction(null);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone.trim() || loading) return;
    setPendingAction('phone');
    try {
      await loginWithPhone(phone.trim());
      router.replace('/(tabs)/home');
    } catch (err) {
      console.error(err);
    } finally {
      setPendingAction(null);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (loading) return;
    setPendingAction(provider);
    try {
      await loginWithSocial(provider);
      router.replace('/(tabs)/home');
    } catch (err) {
      console.error(err);
    } finally {
      setPendingAction(null);
    }
  };

  const isSubmitting = loading;
  const emailButtonLoading = isSubmitting && pendingAction === 'email';
  const phoneButtonLoading = isSubmitting && pendingAction === 'phone';

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>Đăng nhập</Text>
      <Text style={styles.subtitle}>
        {loginMode === 'email' ? 'Nhập email và mật khẩu' : 'Nhập số điện thoại hoặc chọn mạng xã hội'}
      </Text>

      {/* Mode Toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          onPress={() => setLoginMode('email')}
          style={[styles.toggleButton, loginMode === 'email' && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleText, loginMode === 'email' && styles.toggleTextActive]}>
            Email
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setLoginMode('phone')}
          style={[styles.toggleButton, loginMode === 'phone' && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleText, loginMode === 'phone' && styles.toggleTextActive]}>
            Điện thoại
          </Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        {loginMode === 'email' ? (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.inputRounded}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mật khẩu"
              secureTextEntry
              style={styles.inputRounded}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button
              label={emailButtonLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              onPress={handleEmailLogin}
              disabled={isSubmitting || !email.trim() || !password.trim()}
              style={styles.primaryButton}
            />
          </>
        ) : (
          <>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              style={styles.inputRounded}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button
              label={phoneButtonLoading ? 'Đang xử lý...' : 'Tiếp tục'}
              onPress={handlePhoneLogin}
              disabled={isSubmitting || !phone.trim()}
              style={styles.primaryButton}
            />
          </>
        )}
        <View style={styles.divider}>
          <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
        </View>
        <View style={styles.socialGroup}>
          {(['google', 'apple', 'zalo'] as const).map((provider) => {
            const isButtonLoading = isSubmitting && pendingAction === provider;
            const label =
              provider === 'google'
                ? 'Tiếp tục với Google'
                : provider === 'apple'
                  ? 'Tiếp tục với Apple'
                  : 'Tiếp tục với Zalo';

            return (
              <Pressable
                key={provider}
                onPress={() => handleSocialLogin(provider)}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialButtonPressed,
                  isSubmitting && styles.socialButtonDisabled
                ]}
              >
                <Text style={styles.socialButtonText}>{isButtonLoading ? 'Đang xử lý...' : label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.legal}>
        <Text style={styles.helper}>Bằng việc tiếp tục, bạn đồng ý với</Text>
        <View style={styles.linkRow}>
          <Pressable onPress={() => openLegal('terms')}>
            <Text style={styles.link}>Điều khoản sử dụng</Text>
          </Pressable>
          <Text style={styles.separator}>·</Text>
          <Pressable onPress={() => openLegal('privacy')}>
            <Text style={styles.link}>Chính sách quyền riêng tư</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    color: colors.textPrimary
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center'
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    marginHorizontal: spacing.xl
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md
  },
  toggleButtonActive: {
    backgroundColor: colors.primary
  },
  toggleText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.textSecondary
  },
  toggleTextActive: {
    color: colors.background
  },
  form: {
    gap: spacing.md
  },
  inputRounded: {
    borderRadius: radius.xxl
  },
  errorText: {
    color: colors.danger
  },
  primaryButton: {
    borderRadius: radius.xxl
  },
  divider: {
    alignItems: 'center',
    marginTop: spacing.sm
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: '600'
  },
  socialGroup: {
    gap: spacing.sm
  },
  socialButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  socialButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }]
  },
  socialButtonDisabled: {
    opacity: 0.6
  },
  socialButtonText: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.textPrimary
  },
  legal: {
    gap: spacing.xs,
    marginTop: spacing.lg
  },
  helper: {
    color: colors.textSecondary
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  link: {
    color: colors.primary,
    fontWeight: '700'
  },
  separator: {
    color: colors.textSecondary
  }
});
