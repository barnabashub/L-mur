import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { colors, spacing } from '../../lib/theme';
import { Badge, Button, Card, ErrorText, Input, Label } from '../../components/ui';

export default function ProfileScreen() {
  const { token, me, logout, refreshMe } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!token || !me) {
    return (
      <View style={{ padding: spacing.l, gap: spacing.m }}>
        <Card style={{ gap: spacing.m, alignItems: 'center', padding: spacing.xl }}>
          <Text style={{ fontSize: 40 }}>💛</Text>
          <Text style={{ fontWeight: '700', fontSize: 17, color: colors.text }}>Üdvözlünk a Kettesben-ben!</Text>
          <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 13 }}>
            Lépj be vagy regisztrálj, hogy pipálhass, listázhass és közös naplót vezethessetek.
          </Text>
          <View style={{ alignSelf: 'stretch', gap: spacing.s }}>
            <Button title="Belépés" onPress={() => router.push('/login')} />
            <Button title="Regisztráció" variant="secondary" onPress={() => router.push('/register')} />
          </View>
        </Card>
      </View>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setInfo(null);
    try {
      await fn();
      await refreshMe();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.l, gap: spacing.m }}>
      <ErrorText text={error} />
      {info && (
        <Card style={{ backgroundColor: colors.greenBg, borderColor: '#a7f3d0' }}>
          <Text style={{ color: colors.green, fontSize: 13 }}>{info}</Text>
        </Card>
      )}

      <Card style={{ gap: 6 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{me.name}</Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{me.email}</Text>
          <Badge text={me.emailVerified ? '✓ megerősítve' : 'nincs megerősítve'} tone={me.emailVerified ? 'green' : 'amber'} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.l, marginTop: spacing.m }}>
          {[
            [me.stats.completionCount, 'kipipált randi'],
            [me.stats.ideaCount, 'beküldött ötlet'],
            [me.stats.listCount, 'saját lista'],
          ].map(([n, label]) => (
            <View key={String(label)} style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>{n}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, textAlign: 'center' }}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ gap: spacing.s }}>
        <Text style={{ fontWeight: '700', color: colors.text }}>Párom 💑</Text>
        {me.partner ? (
          <Text style={{ color: colors.text, fontSize: 14 }}>
            Összekapcsolva: <Text style={{ fontWeight: '700' }}>{me.partner.name}</Text>
          </Text>
        ) : me.inviteCode ? (
          <>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Oszd meg ezt a kódot a pároddal — a Profil fülön tudja beírni:
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: 6,
                color: colors.primaryDark,
                textAlign: 'center',
                paddingVertical: spacing.s,
              }}
            >
              {me.inviteCode}
            </Text>
          </>
        ) : (
          <>
            <Button
              title="Meghívókód készítése"
              variant="secondary"
              onPress={() => run(async () => { await api.couple(token, { action: 'invite' }); })}
            />
            <Label text="…vagy írd be a párodtól kapott kódot:" />
            <Input value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="ABC123" maxLength={6} />
            <Button
              title="Összekapcsolódás"
              disabled={code.trim().length !== 6}
              onPress={() =>
                run(async () => {
                  const res = await api.couple(token, { action: 'join', code: code.trim() });
                  setInfo(res.partnerName ? `Összekapcsolódtatok: ${res.partnerName} 💛` : 'Csatlakoztál!');
                  setCode('');
                })
              }
            />
          </>
        )}
        {(me.partner || me.inviteCode) && (
          <Button
            title="Szétkapcsolás / kód visszavonása"
            variant="danger"
            onPress={() => run(async () => { await api.couple(token, { action: 'leave' }); })}
          />
        )}
      </Card>

      <Button title="Kijelentkezés" variant="ghost" onPress={logout} />
    </ScrollView>
  );
}
