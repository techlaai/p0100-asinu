import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, spacing } from '@/ui/theme';
import NetInfo from '@react-native-community/netinfo';

export const OfflineScreen = () => {
  const [state, setState] = useState('unknown');

  const handleRetry = async () => {
    const info = await NetInfo.fetch();
    setState(info.isConnected ? 'online' : 'offline');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline mode</Text>
      <Text style={styles.subtitle}>Status: {state}</Text>
      <Pressable style={styles.button} onPress={handleRetry}>
        <Text style={styles.buttonLabel}>Retry connection</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary
  },
  subtitle: {
    color: colors.textSecondary
  },
  button: {
    padding: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.primary
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '700'
  }
});
