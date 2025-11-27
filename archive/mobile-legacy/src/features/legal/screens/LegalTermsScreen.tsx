import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '@/ui/theme';

export const LegalTermsScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms &amp; Privacy</Text>
      <Text style={styles.subtitle}>Fetched from `/api/mobile/legal/terms`</Text>
      <Text style={styles.body}>
        TODO: render markdown viewer + consent CTA. This placeholder keeps the contract visible while data + copy are wired.
      </Text>
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
  subtitle: {
    color: colors.textSecondary
  },
  body: {
    color: colors.textPrimary,
    lineHeight: 20
  }
});
