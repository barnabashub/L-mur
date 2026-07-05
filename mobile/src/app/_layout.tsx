import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { ThemeProvider, useTheme } from '../lib/theme';

function ThemedStack() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: t.primary,
        headerTitleStyle: { color: t.text },
        headerStyle: { backgroundColor: t.card },
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Belépés', presentation: 'modal' }} />
      <Stack.Screen name="register" options={{ title: 'Regisztráció', presentation: 'modal' }} />
      <Stack.Screen name="otlet/[id]" options={{ title: 'Randiötlet' }} />
      <Stack.Screen name="lista/[id]" options={{ title: 'Bakancslista' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <ThemedStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
