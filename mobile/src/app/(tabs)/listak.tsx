import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api, type ListSummary } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { spacing, useTheme } from '../../lib/theme'
import { Button, Card, Empty, ErrorText, Input } from '../../components/ui';

export default function ListsScreen() {
  const t = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLists(await api.lists(token));
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

  const create = async () => {
    if (!token || newTitle.trim().length < 3) return;
    try {
      await api.createList(token, newTitle.trim());
      setNewTitle('');
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <FlatList
      data={lists}
      keyExtractor={(l) => l.id}
      contentContainerStyle={{ padding: spacing.l }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={t.primary} />}
      ListHeaderComponent={<ErrorText text={error} />}
      renderItem={({ item }) => {
        const pct = item.total === 0 ? 0 : Math.round((item.done / item.total) * 100);
        return (
          <Pressable onPress={() => router.push({ pathname: '/lista/[id]', params: { id: item.id } })}>
            <Card style={{ marginBottom: spacing.m }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, flex: 1 }}>
                  {item.isSystem ? '⭐ ' : ''}{item.title}
                </Text>
                <Text style={{ fontSize: 12, color: t.muted }}>{item.total} ötlet</Text>
              </View>
              {!!item.description && (
                <Text style={{ fontSize: 13, color: t.muted, marginTop: 4 }}>{item.description}</Text>
              )}
              {token && item.total > 0 && (
                <View style={{ marginTop: spacing.m }}>
                  <View style={{ height: 6, backgroundColor: t.bg, borderRadius: 999, overflow: 'hidden' }}>
                    <View style={{ height: 6, width: `${pct}%`, backgroundColor: t.primary, borderRadius: 999 }} />
                  </View>
                  <Text style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>
                    {item.done}/{item.total} teljesítve ({pct}%)
                  </Text>
                </View>
              )}
            </Card>
          </Pressable>
        );
      }}
      ListEmptyComponent={!loading ? <Empty text="Még nincsenek listák." /> : null}
      ListFooterComponent={
        token ? (
          <Card style={{ marginTop: spacing.s, gap: spacing.m }}>
            <Text style={{ fontWeight: '700', color: t.text }}>+ Új saját lista</Text>
            <Input placeholder="A lista neve (pl. Nagy közös terveink)" value={newTitle} onChangeText={setNewTitle} />
            <Button title="Lista létrehozása" onPress={create} disabled={newTitle.trim().length < 3} />
          </Card>
        ) : (
          <Empty text="Saját bakancslistához lépj be a Profil fülön." />
        )
      }
    />
  );
}
