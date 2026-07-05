import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { api, type IdeaSummary } from '../../lib/api';
import { spacing, useTheme } from '../../lib/theme'
import { IdeaCard } from '../../components/IdeaCard';
import { Empty, ErrorText, Input } from '../../components/ui';

const CATEGORIES = ['Természet', 'Kultúra', 'Gasztronómia', 'Aktív / sport', 'Romantikus', 'Otthoni', 'Esemény', 'Kaland'];

export default function IdeasScreen() {
  const t = useTheme();
  const [ideas, setIdeas] = useState<IdeaSummary[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setIdeas(await api.ideas({ q: q || undefined, kategoria: category ?? undefined }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [q, category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <FlatList
      data={ideas}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => <IdeaCard idea={item} />}
      contentContainerStyle={{ padding: spacing.l }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={t.primary} />}
      ListHeaderComponent={
        <View style={{ gap: spacing.m, marginBottom: spacing.m }}>
          <Input
            placeholder="Keresés címre, leírásra, helyre…"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={load}
            returnKeyType="search"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(active ? null : c)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active ? t.primary : t.card,
                    borderWidth: 1,
                    borderColor: active ? t.primary : t.border,
                  }}
                >
                  <Text style={{ color: active ? '#fff' : t.muted, fontSize: 13, fontWeight: '600' }}>{c}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ErrorText text={error} />
        </View>
      }
      ListEmptyComponent={!loading ? <Empty text="Nincs a szűrőknek megfelelő ötlet." /> : null}
    />
  );
}
