import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { colors, spacing } from '@/ui/theme';
import { mobileRequest } from '@/lib/api/mobileClient';
import { useMobileSession } from '@/features/mobile/providers/MobileSessionProvider';

export const DonateFlowScreen = () => {
  const { featureFlags } = useMobileSession();
  const [provider, setProvider] = useState('vnpay');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  if (!featureFlags.DONATE_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.note}>Donate đang bị tắt.</Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    try {
      setStatus('processing');
      await mobileRequest('/api/mobile/donate/intent', {
        method: 'POST',
        body: { provider, amount: Number(amount) }
      });
      setStatus('done');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Donate Flow</Text>
      <TextInput placeholder="Provider (vnpay/momo)" style={styles.input} value={provider} onChangeText={setProvider} />
      <TextInput placeholder="Amount" style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Pressable style={styles.submit} onPress={handleSubmit}>
        <Text style={styles.submitLabel}>Create intent</Text>
      </Pressable>
      {status && <Text style={styles.status}>Status: {status}</Text>}
      <Text style={styles.note}>POST `/api/mobile/donate/intent` + `/api/mobile/donate/providers` for provider list.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    borderRadius: spacing.md
  },
  submit: {
    padding: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary
  },
  submitLabel: {
    color: '#fff',
    fontWeight: '700'
  },
  status: {
    color: colors.textPrimary
  },
  note: {
    color: colors.textSecondary
  }
});
