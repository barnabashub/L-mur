import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { colors, spacing } from '../lib/theme';
import { Button, Card, ErrorText, Input, Label } from '../components/ui';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.dismissAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.l }}>
      <Card style={{ gap: spacing.s }}>
        <Label text="E-mail cím" />
        <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Label text="Jelszó" />
        <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        <ErrorText text={error} />
        <Button title="Belépés" onPress={submit} loading={busy} disabled={!email || !password} />
        <Button title="Még nincs fiókom — regisztráció" variant="ghost" onPress={() => router.replace('/register')} />
        <Text style={{ fontSize: 12, color: colors.faint, textAlign: 'center' }}>
          Elfelejtett jelszó? A webes felületen tudod visszaállítani.
        </Text>
      </Card>
    </ScrollView>
  );
}
