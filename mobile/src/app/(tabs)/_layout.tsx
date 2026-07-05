import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../lib/theme';

function icon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ötletek', headerTitle: '💛 Kettesben', tabBarIcon: icon('💡') }} />
      <Tabs.Screen name="listak" options={{ title: 'Listák', headerTitle: 'Bakancslisták', tabBarIcon: icon('📝') }} />
      <Tabs.Screen name="naplo" options={{ title: 'Naplónk', headerTitle: 'Randinaplónk 🔒', tabBarIcon: icon('📖') }} />
      <Tabs.Screen name="ertesitesek" options={{ title: 'Értesítések', tabBarIcon: icon('🔔') }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', headerTitle: 'Profilom', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
