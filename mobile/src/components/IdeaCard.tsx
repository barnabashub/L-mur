import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { imageUrl, type IdeaSummary } from '../lib/api';
import { radius, spacing, useTheme } from '../lib/theme';
import { Badge, Stars } from './ui';

export const ACCESSIBILITY_LABELS: Record<string, { emoji: string; label: string }> = {
  'kerekesszek': { emoji: '♿', label: 'Kerekesszékkel megközelíthető' },
  'latasserult': { emoji: '🦯', label: 'Látássérült-barát' },
  'hallasserult': { emoji: '🦻', label: 'Hallássérült-barát' },
  'babakocsi': { emoji: '👶', label: 'Babakocsival járható' },
  'keves-seta': { emoji: '🪑', label: 'Kevés sétával teljesíthető' },
};

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
  const t = useTheme();
  const router = useRouter();
  const img = imageUrl(idea.imagePath);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/otlet/[id]', params: { id: idea.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${idea.title} megnyitása`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: t.card, borderColor: t.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      {img ? (
        <Image source={{ uri: img }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder, { backgroundColor: t.roseBg }]}>
          <Text style={{ fontSize: 44 }}>{CATEGORY_EMOJI[idea.category] ?? '💜'}</Text>
        </View>
      )}
      <View style={{ padding: spacing.m, gap: 6 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Badge text={idea.category} />
          {idea.hasDiscount && <Badge text="🎟️ kedvezmény" tone="amber" />}
          {completed && <Badge text="✔ teljesítve" tone="green" />}
          {(idea.accessibility ?? []).map((k) =>
            ACCESSIBILITY_LABELS[k] ? (
              <Badge key={k} text={ACCESSIBILITY_LABELS[k].emoji} tone="green" />
            ) : null
          )}
        </View>
        <Text style={[styles.title, { color: t.text }]}>{idea.title}</Text>
        <Text style={{ fontSize: 12, color: t.muted }}>
          {idea.isLocationIndependent ? '🌍 Bárhol megvalósítható' : `📍 ${idea.locationName}`}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stars value={idea.avg} count={idea.reviewCount} />
          <Text style={{ fontSize: 11, color: t.muted }}>✔ {idea.completionCount} pár</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.l,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.m,
  },
  image: { width: '100%', height: 140 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800' },
});
