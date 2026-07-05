import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { spacing } from '../lib/theme';
import { Button, Card, ErrorText, Input, Label } from '../components/ui';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await register(name.trim(), email.trim(), password);
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
        <Label text="Név" />
        <Input value={name} onChangeText={setName} autoComplete="name" />
        <Label text="E-mail cím" />
        <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Label text="Jelszó (legalább 8 karakter)" />
        <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        <ErrorText text={error} />
        <Button
          title="Fiók létrehozása"
          onPress={submit}
          loading={busy}
          disabled={name.trim().length < 2 || !email.includes('@') || password.length < 8}
        />
        <Button title="Van már fiókom — belépés" variant="ghost" onPress={() => router.replace('/login')} />
      </Card>
    </ScrollView>
  );
}
