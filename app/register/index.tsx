import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { TextInput } from '../../src/components/TextInput';
import { Toast } from '../../src/components/Toast';
import { authApi } from '../../src/features/auth/auth.api';
import { getPasswordStrength, validateEmail, validatePassword, validatePhone } from '../../src/lib/validation';
import { colors, spacing, typography } from '../../src/styles';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAgreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openLegal = (type: 'terms' | 'privacy') => {
    router.push({ pathname: '/legal/content', params: { type } });
  };

  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setEmailError(error || undefined);
  };

  const handlePhoneBlur = () => {
    const error = validatePhone(phone);
    setPhoneError(error || undefined);
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setPasswordError(error || undefined);
  };

  const getPasswordStrengthColor = () => {
    if (!password) return colors.textSecondary;
    const { strength } = getPasswordStrength(password);
    if (strength === 'weak') return '#ef4444';
    if (strength === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  const getPasswordStrengthText = () => {
    if (!password) return '';
    const { strength } = getPasswordStrength(password);
    if (strength === 'weak') return 'Yếu';
    if (strength === 'medium') return 'Trung bình';
    return 'Mạnh';
  };

  const handleSubmit = async () => {
    // Validate
    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    const passwordErr = validatePassword(password);
    
    setEmailError(emailErr || undefined);
    setPhoneError(phoneErr || undefined);
    setPasswordError(passwordErr || undefined);
    
    if (emailErr || phoneErr || passwordErr) {
      setError('Vui lòng kiểm tra lại thông tin');
      return;
    }
    
    if (!isAgreed) {
      setError('Vui lòng đồng ý Điều khoản & Chính sách');
      return;
    }
    
    setError(undefined);
    setLoading(true);
    try {
      await authApi.register({ 
        email: email.trim(), 
        phone_number: phone.trim(),
        password: password.trim(),
        full_name: name.trim() || undefined
      });
      setToastMessage('Đăng ký thành công! Vui lòng đăng nhập.');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => router.replace('/login'), 1500);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
      setToastMessage(err.message || 'Đăng ký thất bại');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Toast 
        visible={showToast}
        message={toastMessage}
        type={toastType}
        position="center"
        onHide={() => setShowToast(false)}
      />
      
      <Text style={styles.title}>Tạo tài khoản</Text>
      <Text style={styles.subtitle}>Nhập thông tin cơ bản để bắt đầu</Text>
      
      <View style={styles.form}>
        <View>
          <TextInput 
            label="Email *" 
            value={email} 
            onChangeText={(text) => {
              setEmail(text);
              setEmailError(undefined);
            }}
            onBlur={handleEmailBlur}
            autoCapitalize="none" 
            keyboardType="email-address" 
            placeholder="example@email.com"
          />
          {emailError && <Text style={styles.fieldError}>{emailError}</Text>}
        </View>
        
        <View>
          <TextInput 
            label="Số điện thoại *" 
            value={phone} 
            onChangeText={(text) => {
              setPhone(text);
              setPhoneError(undefined);
            }}
            onBlur={handlePhoneBlur}
            keyboardType="phone-pad" 
            placeholder="0912345678" 
          />
          <Text style={styles.fieldHelp}>Bắt đầu bằng số 0 (hoặc +84)</Text>
          {phoneError && <Text style={styles.fieldError}>{phoneError}</Text>}
        </View>
        
        <View>
          <TextInput 
            label="Mật khẩu *" 
            value={password} 
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError(undefined);
            }}
            onBlur={handlePasswordBlur}
            secureTextEntry 
            placeholder="Ít nhất 8 ký tự"
          />
          {passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
          {password && !passwordError && (
            <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
              Độ mạnh: {getPasswordStrengthText()}
            </Text>
          )}
        </View>
        
        <TextInput 
          label="Họ tên (tùy chọn)" 
          value={name} 
          onChangeText={setName} 
          placeholder="Nguyễn Văn A" 
        />
        
        <View style={styles.checkboxRow}>
          <Pressable style={styles.checkboxToggle} onPress={() => setAgreed(!isAgreed)}>
            <Ionicons
              name={isAgreed ? 'checkbox' : 'square-outline'}
              size={22}
              color={isAgreed ? colors.primary : colors.textSecondary}
            />
            <Text style={styles.checkboxLabel}>Tôi đồng ý với </Text>
          </Pressable>
          <Pressable onPress={() => openLegal('terms')}>
            <Text style={[styles.checkboxLabel, styles.linkItalic]}>Điều khoản sử dụng</Text>
          </Pressable>
          <Text style={styles.checkboxLabel}> & </Text>
          <Pressable onPress={() => openLegal('privacy')}>
            <Text style={[styles.checkboxLabel, styles.linkItalic]}>Chính sách riêng tư</Text>
          </Pressable>
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Button
          label={loading ? 'Đang xử lý...' : 'Đăng ký'}
          onPress={handleSubmit}
          disabled={!isAgreed || loading}
          style={{ opacity: isAgreed ? 1 : 0.5 }}
        />
        
        {/* Link to Login */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginLinkText}>Đã có tài khoản? </Text>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.loginLinkButton}>Đăng nhập</Text>
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
    color: colors.textSecondary
  },
  form: {
    gap: spacing.md
  },
  fieldError: {
    color: colors.danger,
    fontSize: typography.size.sm,
    marginTop: spacing.xs / 2,
  },
  fieldHelp: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: spacing.xs / 2,
  },
  strengthText: {
    fontSize: typography.size.sm,
    marginTop: spacing.xs / 2,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  checkboxToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  checkboxLabel: {
    color: colors.textPrimary
  },
  linkItalic: {
    color: colors.primary,
    fontStyle: 'italic',
    fontWeight: '700'
  },
  errorText: {
    color: colors.danger
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginLinkText: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
  },
  loginLinkButton: {
    fontSize: typography.size.md,
    color: colors.primary,
    fontWeight: '700',
  }
});
