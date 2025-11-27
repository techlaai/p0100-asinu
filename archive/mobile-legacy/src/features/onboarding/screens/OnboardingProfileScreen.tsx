import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing } from '@/ui/theme';

export const OnboardingProfileScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete your profile</Text>
      <TextInput placeholder="Full name" style={styles.input} />
      <TextInput placeholder="Date of birth" style={styles.input} />
      <TextInput placeholder="Goals" style={styles.input} />
      <Text style={styles.metaHeader}>Remote dependencies</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>GET `/api/mobile/profile/template`</Text>
        <Text style={styles.metaText}>PUT `/api/mobile/profile`</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background
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
  metaHeader: {
    marginTop: spacing.lg,
    fontWeight: '600',
    color: colors.textPrimary
  },
  meta: {
    gap: spacing.xs
  },
  metaText: {
    color: colors.textSecondary
  }
});
