import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { DrawerLayout } from '@/ui/layouts/DrawerLayout';
import { colors } from '@/ui/theme';

export default function DrawerShell() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        initialRouteName="(tabs)"
        screenOptions={{
          headerShown: false,
          drawerType: 'slide',
          sceneContainerStyle: { backgroundColor: colors.background }
        }}
        drawerContent={(props) => <DrawerLayout {...props} workspaceName="Asinu Family Health" tagline="Mobile contracts" />}
      >
        <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Primary Tabs' }} />
        <Drawer.Screen name="donate" options={{ drawerLabel: 'Donate' }} />
        <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings' }} />
        <Drawer.Screen name="offline" options={{ drawerLabel: 'Offline' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
