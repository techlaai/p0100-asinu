import { Image } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../src/styles';
import homeIcon from '../../src/assets/tab-icons/home.png';
import missionIcon from '../../src/assets/tab-icons/mission.png';
import healthcheckIcon from '../../src/assets/tab-icons/healthcheck.png';
import profileIcon from '../../src/assets/tab-icons/profile.png';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2
        },
        tabBarStyle: {
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: 12,
          height: 72,
          paddingTop: 12,
          paddingBottom: 12,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderRadius: 20,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 }
        }
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Trang chủ',
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ focused }) => (
            <Image
              source={homeIcon}
              style={{ width: 50, height: 50, opacity: focused ? 1 : 0.5 }}
              resizeMode="contain"
            />
          )
        }}
      />
      <Tabs.Screen
        name="missions/index"
        options={{
          title: 'Nhiệm vụ',
          tabBarLabel: 'Nhiệm vụ',
          tabBarIcon: ({ focused }) => (
            <Image
              source={missionIcon}
              style={{ width: 50, height: 50, opacity: focused ? 1 : 0.5 }}
              resizeMode="contain"
            />
          )
        }}
      />
      <Tabs.Screen
        name="tree/index"
        options={{
          title: 'Tổng quan',
          tabBarLabel: 'Tổng quan',
          tabBarIcon: ({ focused }) => (
            <Image
              source={healthcheckIcon}
              style={{ width: 50, height: 50, opacity: focused ? 1 : 0.5 }}
              resizeMode="contain"
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Cá nhân',
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ focused }) => (
            <Image
              source={profileIcon}
              style={{ width: 50, height: 50, opacity: focused ? 1 : 0.5 }}
              resizeMode="contain"
            />
          )
        }}
      />
    </Tabs>
  );
}
