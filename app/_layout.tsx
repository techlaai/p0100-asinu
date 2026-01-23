import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '../src/providers/QueryProvider';
import { SessionProvider } from '../src/providers/SessionProvider';
import { CarePulseProvider } from '../src/features/care-pulse';
import { Pressable, Text } from 'react-native';
import { colors, spacing, typography } from '../src/styles';
import '../src/lib/initErrorHandler';

export default function RootLayout() {
  return (
    <QueryProvider>
      <SessionProvider>
        <SafeAreaProvider>
          <CarePulseProvider>
            <StatusBar style="dark" translucent backgroundColor="transparent" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background }
              }}
            >
              <Stack.Screen
                name="legal/content"
                options={({ navigation }) => ({
                  presentation: 'modal',
                  headerShown: true,
                  title: 'Äiá»u khoáº£n',
                  headerTitleStyle: {
                    color: colors.textPrimary,
                    fontSize: typography.size.md,
                    fontWeight: '700'
                  },
                  headerStyle: { backgroundColor: colors.surface },
                  headerShadowVisible: false,
                  headerLeft: () => (
                    <Pressable
                      onPress={() => navigation.goBack()}
                      style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
                    >
                      <Text style={{ color: colors.primary, fontSize: typography.size.md, fontWeight: '700' }}>
                        ÄÃ³ng
                      </Text>
                    </Pressable>
                  )
                })}
              />
            </Stack>
          </CarePulseProvider>
        </SafeAreaProvider>
      </SessionProvider>
    </QueryProvider>
  );
}
