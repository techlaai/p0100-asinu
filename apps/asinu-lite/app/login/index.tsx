import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { TextInput } from '../../src/components/TextInput';
import { useAuthStore } from '../../src/features/auth/auth.store';
import { colors, spacing, typography } from '../../src/styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('demo@asinu.health');
  const [password, setPassword] = useState('password');
  const login = useAuthStore((state) => state.login);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await login({ email, password });
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng quay lại</Text>
      <Text style={styles.subtitle}>Đăng nhập để tiếp tục chăm sóc</Text>
      <View style={styles.form}>
        <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
        <Button label={loading ? 'Đang đăng nhập' : 'Đăng nhập'} onPress={handleLogin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.textSecondary
  },
  form: {
    gap: spacing.md
  }
});
