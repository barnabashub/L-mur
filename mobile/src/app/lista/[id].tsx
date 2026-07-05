import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { api, type ListDetail } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { spacing, useTheme } from '../../lib/theme'
import { IdeaCard } from '../../components/IdeaCard';
import { Card, Empty, ErrorText } from '../../components/ui';

export default function ListScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [list, setList] = useState<ListDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await api.list(id, token));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!list) {
    return (
      <View style={{ padding: spacing.l }}>
        <ErrorText text={error} />
      </View>
    );
  }

  const done = list.items.filter((i) => i.completed).length;
  const pct = list.items.length === 0 ? 0 : Math.round((done / list.items.length) * 100);

  return (
    <FlatList
      data={list.items}
      keyExtractor={(i) => i.itemId}
      contentContainerStyle={{ padding: spacing.l }}
      ListHeaderComponent={
        <View style={{ gap: spacing.m, marginBottom: spacing.m }}>
          <Stack.Screen options={{ title: list.title }} />
          {!!list.description && <Text style={{ color: t.muted, fontSize: 13 }}>{list.description}</Text>}
          {token && list.items.length > 0 && (
            <Card>
              <View style={{ height: 8, backgroundColor: t.bg, borderRadius: 999, overflow: 'hidden' }}>
                <View style={{ height: 8, width: `${pct}%`, backgroundColor: t.primary, borderRadius: 999 }} />
              </View>
              <Text style={{ fontSize: 13, color: t.text, marginTop: spacing.s }}>
                <Text style={{ fontWeight: '800' }}>{done}</Text> / {list.items.length} teljesítve ({pct}%)
                {pct === 100 ? ' — gratulálunk! 🎉' : ''}
              </Text>
            </Card>
          )}
          <ErrorText text={error} />
        </View>
      }
      renderItem={({ item }) => (
        <IdeaCard
          idea={{
            id: item.id,
            title: item.title,
            category: item.category,
            imagePath: item.imagePath,
            locationName: item.locationName,
            isLocationIndependent: item.isLocationIndependent,
            isSeasonal: false,
            seasonLabel: null,
            avg: item.avg,
            reviewCount: 0,
            completionCount: item.completionCount,
            hasDiscount: false,
          }}
          completed={item.completed}
        />
      )}
      ListEmptyComponent={<Empty text="Ez a lista még üres — adj hozzá ötleteket a böngészőből!" />}
    />
  );
}
