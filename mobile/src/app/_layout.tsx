import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Belépés', presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ title: 'Regisztráció', presentation: 'modal' }} />
        <Stack.Screen name="otlet/[id]" options={{ title: 'Randiötlet' }} />
        <Stack.Screen name="lista/[id]" options={{ title: 'Bakancslista' }} />
      </Stack>
    </AuthProvider>
  );
}
