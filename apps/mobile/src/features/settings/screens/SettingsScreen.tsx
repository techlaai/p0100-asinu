import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Switch, Pressable } from 'react-native';
import { colors, spacing } from '@/ui/theme';
import { mobileRequest } from '@/lib/api/mobileClient';

export const SettingsScreen = () => {
  const [notifications, setNotifications] = useState(true);
  const [aiTips, setAiTips] = useState(false);

  const handleLogout = async () => {
    await mobileRequest('/api/mobile/auth/logout', { method: 'POST' });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Notifications</Text>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>AI Tips</Text>
        <Switch value={aiTips} onValueChange={setAiTips} />
      </View>
      <Pressable style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutLabel}>Logout</Text>
      </Pressable>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.lg
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '600'
  },
  logout: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.danger
  },
  logoutLabel: {
    color: '#fff',
    fontWeight: '700'
  }
});
