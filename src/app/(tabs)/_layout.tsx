import Tabs from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/icons/icon';
import { useTheme } from '@/theme/theme-provider';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'drop' },
  { name: 'plants', title: 'Plants', icon: 'potted-plant' },
  { name: 'light', title: 'Light', icon: 'sun' },
  { name: 'settings', title: 'Settings', icon: 'gear' },
];

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Icon name={tab.icon} size={24} color={String(color)} duotone={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
