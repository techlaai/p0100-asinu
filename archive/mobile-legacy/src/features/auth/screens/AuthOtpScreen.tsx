import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing } from '@/ui/theme';

export const AuthOtpScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phone verification</Text>
      <TextInput placeholder="Phone number" style={styles.input} keyboardType="phone-pad" />
      <TextInput placeholder="OTP code" style={styles.input} keyboardType="number-pad" />
      <View style={styles.meta}>
        <Text style={styles.metaText}>POST `/api/mobile/auth/otp/send`</Text>
        <Text style={styles.metaText}>POST `/api/mobile/auth/otp/verify`</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  input: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.lg,
    color: colors.textPrimary
  },
  meta: {
    marginTop: spacing.lg,
    gap: spacing.xs
  },
  metaText: {
    color: colors.textSecondary
  }
});
