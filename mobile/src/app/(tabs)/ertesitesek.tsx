import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api, type AppNotification } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { colors, spacing } from '../../lib/theme';
import { Button, Card, Empty, ErrorText } from '../../components/ui';

const TYPE_EMOJI: Record<string, string> = {
  IDEA: '💡',
  MODERATION: '🛡️',
  WARNING: '⚠️',
  COUPLE: '💑',
  ANNIVERSARY: '🎉',
};

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await api.notifications(token));
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
        <Empty text="Az értesítéseidhez lépj be a Profil fülön." />
      </View>
    );
  }

  const markAll = async () => {
    await api.markAllRead(token);
    await load();
  };

  const hasUnread = items.some((n) => !n.read);

  return (
    <FlatList
      data={items}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: spacing.l }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ gap: spacing.m, marginBottom: spacing.m }}>
          <ErrorText text={error} />
          {hasUnread && <Button title="Mind olvasottnak jelölése" variant="secondary" onPress={markAll} />}
        </View>
      }
      renderItem={({ item }) => (
        <Card
          style={{
            marginBottom: spacing.s,
            flexDirection: 'row',
            gap: spacing.m,
            opacity: item.read ? 0.65 : 1,
            borderColor: item.read ? colors.border : '#fecdd3',
          }}
        >
          <Text style={{ fontSize: 18 }}>{TYPE_EMOJI[item.type] ?? '🔔'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: colors.text }}>{item.message}</Text>
            <Text style={{ fontSize: 11, color: colors.faint, marginTop: 4 }}>
              {new Date(item.createdAt).toLocaleString('hu-HU')}
            </Text>
          </View>
          {!item.read && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 }} />
          )}
        </Card>
      )}
      ListEmptyComponent={!loading ? <Empty text="Nincs értesítésed." /> : null}
    />
  );
}
