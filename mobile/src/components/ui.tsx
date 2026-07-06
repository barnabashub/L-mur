import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { radius, spacing, useTheme } from '../lib/theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}) {
  const t = useTheme();
  const bg = {
    primary: t.primary,
    secondary: t.roseBg,
    ghost: 'transparent',
    danger: 'rgba(239, 68, 68, 0.12)',
  }[variant];
  const fg = {
    primary: t.onPrimary,
    secondary: t.primaryDark,
    ghost: t.muted,
    danger: '#ef4444',
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.faint}
      {...props}
      style={[
        styles.input,
        { borderColor: t.border, backgroundColor: t.card, color: t.text },
        props.style,
      ]}
    />
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, style]}>
      {children}
    </View>
  );
}

export function Badge({ text, tone = 'rose' }: { text: string; tone?: 'rose' | 'amber' | 'green' | 'muted' }) {
  const t = useTheme();
  const bg = { rose: t.roseBg, amber: t.amberBg, green: t.greenBg, muted: t.bg }[tone];
  const fg = { rose: t.primaryDark, amber: t.amber, green: t.green, muted: t.muted }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export function Stars({ value, count, size = 14 }: { value: number | null; count?: number; size?: number }) {
  const t = useTheme();
  if (value === null) return <Text style={{ color: t.faint, fontSize: size - 2 }}>Még nincs értékelés</Text>;
  const rounded = Math.round(value);
  return (
    <Text style={{ fontSize: size }}>
      <Text style={{ color: t.star }}>{'★'.repeat(rounded)}</Text>
      <Text style={{ color: t.border }}>{'★'.repeat(5 - rounded)}</Text>
      <Text style={{ color: t.muted, fontSize: size - 2 }}>
        {' '}{value.toFixed(1)}{count !== undefined ? ` (${count})` : ''}
      </Text>
    </Text>
  );
}

/** Érintéssel választható csillagsor űrlapokhoz. */
export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.s }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${n} csillag`}
          accessibilityState={{ selected: n <= value }}
        >
          <Text style={{ fontSize: 30, color: n <= value ? t.star : t.border }}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  const t = useTheme();
  return (
    <Card style={{ padding: spacing.xl, alignItems: 'center' }}>
      <Text style={{ color: t.muted, textAlign: 'center' }}>{text}</Text>
    </Card>
  );
}

export function Label({ text }: { text: string }) {
  const t = useTheme();
  return <Text style={[styles.label, { color: t.text }]}>{text}</Text>;
}

export function ErrorText({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={{ color: '#f87171', fontSize: 13 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.m,
    paddingVertical: 13,
    paddingHorizontal: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontWeight: '800', fontSize: 15 },
  input: {
    borderWidth: 1,
    borderRadius: radius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: 10,
    fontSize: 15,
  },
  card: {
    borderRadius: radius.l,
    borderWidth: 1,
    padding: spacing.l,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 4, marginTop: spacing.m },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderRadius: radius.m,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
});
