import React, { useCallback, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { api, imageUrl, type JournalEntry } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { spacing, useTheme } from '../../lib/theme'
import { Button, Card, Empty, ErrorText, Input, Label } from '../../components/ui';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function JournalScreen() {
  const t = useTheme();
  const { token } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setEntries(await api.journal(token));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!token) {
    return (
      <View style={{ padding: spacing.l }}>
        <Empty text="A randinapló csak nektek szól — a megtekintéséhez lépj be a Profil fülön." />
      </View>
    );
  }

  const addMemory = async () => {
    if (title.trim().length < 2) return;
    try {
      await api.addMemory(token, {
        title: title.trim(),
        date: new Date().toISOString().slice(0, 10),
        text: text.trim() || undefined,
      });
      setTitle('');
      setText('');
      setShowForm(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <FlatList
      data={entries}
      keyExtractor={(e) => `${e.kind}-${e.id}`}
      contentContainerStyle={{ padding: spacing.l }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={t.primary} />}
      ListHeaderComponent={
        <View style={{ marginBottom: spacing.m, gap: spacing.m }}>
          <ErrorText text={error} />
          {showForm ? (
            <Card style={{ gap: spacing.s }}>
              <Text style={{ fontWeight: '700', color: t.text }}>Appon kívüli randi megörökítése</Text>
              <Label text="Mi volt a randi?" />
              <Input value={title} onChangeText={setTitle} placeholder="pl. Piknik a hegyen" />
              <Label text="Hogy emlékeztek rá?" />
              <Input value={text} onChangeText={setText} multiline numberOfLines={3} />
              <Button title="Mentés a naplóba" onPress={addMemory} disabled={title.trim().length < 2} />
              <Button title="Mégsem" variant="ghost" onPress={() => setShowForm(false)} />
            </Card>
          ) : (
            <Button title="+ Appon kívüli randi megörökítése" variant="secondary" onPress={() => setShowForm(true)} />
          )}
        </View>
      }
      renderItem={({ item }) => {
        const img = imageUrl(item.imagePath);
        return (
          <Card style={{ marginBottom: spacing.m, padding: 0, overflow: 'hidden' }}>
            {img && <Image source={{ uri: img }} style={{ width: '100%', height: 180 }} />}
            <View style={{ padding: spacing.l, gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.primary, textTransform: 'uppercase' }}>
                {formatDate(item.date)} · {item.byName}
                {item.kind === 'memory' ? ' · appon kívüli emlék' : ''}
              </Text>
              {item.kind === 'completion' && item.ideaId ? (
                <Link href={{ pathname: '/otlet/[id]', params: { id: item.ideaId } }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: t.text }}>{item.title}</Text>
                </Link>
              ) : (
                <Text style={{ fontWeight: '700', fontSize: 15, color: t.text }}>{item.title}</Text>
              )}
              {!!item.publicText && <Text style={{ fontSize: 14, color: t.text }}>{item.publicText}</Text>}
              {!!item.privateText && (
                <View style={{ backgroundColor: t.roseBg, borderRadius: 10, padding: spacing.m }}>
                  <Text style={{ fontSize: 14, color: t.text }}>🔒 {item.privateText}</Text>
                </View>
              )}
            </View>
          </Card>
        );
      }}
      ListEmptyComponent={
        !loading ? <Empty text="A naplótok még üres. Pipáljatok ki egy randiötletet!" /> : null
      }
    />
  );
}
