import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { imageUrl, type IdeaSummary } from '../lib/api';
import { colors, radius, spacing } from '../lib/theme';
import { Badge, Stars } from './ui';

const CATEGORY_EMOJI: Record<string, string> = {
  'Természet': '🌲',
  'Kultúra': '🏛️',
  'Gasztronómia': '🍷',
  'Aktív / sport': '🚴',
  'Romantikus': '💕',
  'Otthoni': '🏠',
  'Esemény': '🎪',
  'Kaland': '🎈',
};

export function IdeaCard({ idea, completed }: { idea: IdeaSummary; completed?: boolean }) {
  const router = useRouter();
  const img = imageUrl(idea.imagePath);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/otlet/[id]', params: { id: idea.id } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      {img ? (
        <Image source={{ uri: img }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={{ fontSize: 44 }}>{CATEGORY_EMOJI[idea.category] ?? '💛'}</Text>
        </View>
      )}
      <View style={{ padding: spacing.m, gap: 6 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Badge text={idea.category} />
          {idea.hasDiscount && <Badge text="🎟️ kedvezmény" tone="amber" />}
          {completed && <Badge text="✔ teljesítve" tone="green" />}
        </View>
        <Text style={styles.title}>{idea.title}</Text>
        <Text style={styles.location}>
          {idea.isLocationIndependent ? '🌍 Bárhol megvalósítható' : `📍 ${idea.locationName}`}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stars value={idea.avg} count={idea.reviewCount} />
          <Text style={{ fontSize: 11, color: colors.muted }}>✔ {idea.completionCount} pár</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.m,
  },
  image: { width: '100%', height: 140 },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.roseBg },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  location: { fontSize: 12, color: colors.muted },
});
