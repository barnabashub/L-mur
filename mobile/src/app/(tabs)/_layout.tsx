import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../lib/theme'

function icon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        headerTitleStyle: { color: t.text },
        headerStyle: { backgroundColor: t.card },
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ötletek', headerTitle: 'L’mur', tabBarIcon: icon('💡') }} />
      <Tabs.Screen name="listak" options={{ title: 'Listák', headerTitle: 'Bakancslisták', tabBarIcon: icon('📝') }} />
      <Tabs.Screen name="naplo" options={{ title: 'Naplónk', headerTitle: 'Randinaplónk 🔒', tabBarIcon: icon('📖') }} />
      <Tabs.Screen name="ertesitesek" options={{ title: 'Értesítések', tabBarIcon: icon('🔔') }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', headerTitle: 'Profilom', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
