import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/ui/theme';

export default function FamilyInviteRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Invite</Text>
      <Text style={styles.subtitle}>Placeholder for `/api/mobile/family/invite` flow.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.md
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center'
  }
});
