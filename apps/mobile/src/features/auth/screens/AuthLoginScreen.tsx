import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing } from '@/ui/theme';

export const AuthLoginScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in to Asinu</Text>
      <TextInput placeholder="Email" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry />
      <View style={styles.meta}>
        <Text style={styles.metaText}>POST `/api/mobile/auth/login`</Text>
        <Text style={styles.metaText}>POST `/api/mobile/auth/config`</Text>
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
