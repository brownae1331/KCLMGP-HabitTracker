import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../../components/ThemeContext'
import { HapticTab } from '../../components/HapticTab';
import { IconSymbol } from '../../components/ui/IconSymbol';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../components/styles/Colors';

export default function TabLayout() {
  // const colorScheme = useColorScheme() as 'light'| 'dark';
  const { theme, refreshKey } = useTheme();

  return (
    <Tabs
      key={refreshKey}
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: Colors[theme].background,
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        },
      }}
    >
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="book.fill" color={focused ? Colors[theme].tint : Colors[theme].tabIconDefault} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="calendar" color={focused ? Colors[theme].tint : Colors[theme].tabIconDefault} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="chart.bar.fill" color={focused ? Colors[theme].tint : Colors[theme].tabIconDefault} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="gearshape.fill" color={focused ? Colors[theme].tint : Colors[theme].tabIconDefault} />,
        }}
      />
    </Tabs>
  );
}
