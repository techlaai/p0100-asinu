import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/ui/theme';

export default function TreeEventsRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tree Events</Text>
      <Text style={styles.subtitle}>Placeholder for `/api/mobile/tree/events` timeline.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.textSecondary,
    textAlign: 'center'
  }
});
