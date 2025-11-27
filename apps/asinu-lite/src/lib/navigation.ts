import { router } from 'expo-router';

export const navigation = {
  goToLogin() {
    router.replace('/login');
  },
  goToHome() {
    router.replace('/(tabs)/home');
  },
  goToSettings() {
    router.push('/settings');
  },
  goToLogs(type?: 'glucose' | 'blood-pressure' | 'medication') {
    if (!type) {
      router.push('/logs');
      return;
    }
    const path = `/logs/${type === 'blood-pressure' ? 'blood-pressure' : type}`;
    router.push(path);
  }
};
