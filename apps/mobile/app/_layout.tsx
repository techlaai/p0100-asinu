import { Stack } from 'expo-router';
import { MobileSessionProvider } from '@/features/mobile/providers/MobileSessionProvider';

export default function RootLayout() {
  return (
    <MobileSessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
      </Stack>
    </MobileSessionProvider>
  );
}
