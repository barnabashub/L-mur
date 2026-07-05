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
import { colors, radius, spacing } from '../lib/theme';

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
  const v = styles[`btn_${variant}`];
  const t = styles[`btnText_${variant}`];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, v, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} /> : <Text style={[styles.btnText, t]}>{title}</Text>}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.faint} {...props} style={[styles.input, props.style]} />;
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ text, tone = 'rose' }: { text: string; tone?: 'rose' | 'amber' | 'green' | 'muted' }) {
  const bg = { rose: colors.roseBg, amber: colors.amberBg, green: colors.greenBg, muted: '#f5f5f4' }[tone];
  const fg = { rose: colors.primaryDark, amber: colors.amber, green: colors.green, muted: colors.muted }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

export function Stars({ value, count, size = 14 }: { value: number | null; count?: number; size?: number }) {
  if (value === null) return <Text style={{ color: colors.faint, fontSize: size - 2 }}>Még nincs értékelés</Text>;
  const rounded = Math.round(value);
  return (
    <Text style={{ fontSize: size }}>
      <Text style={{ color: colors.star }}>{'★'.repeat(rounded)}</Text>
      <Text style={{ color: colors.border }}>{'★'.repeat(5 - rounded)}</Text>
      <Text style={{ color: colors.muted, fontSize: size - 2 }}>
        {' '}{value.toFixed(1)}{count !== undefined ? ` (${count})` : ''}
      </Text>
    </Text>
  );
}

/** Érintéssel választható csillagsor űrlapokhoz. */
export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.s }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Text style={{ fontSize: 30, color: n <= value ? colors.star : colors.border }}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <Card style={{ padding: spacing.xl, alignItems: 'center' }}>
      <Text style={{ color: colors.muted, textAlign: 'center' }}>{text}</Text>
    </Card>
  );
}

export function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

export function ErrorText({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={{ color: '#991b1b', fontSize: 13 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.m,
    paddingVertical: 12,
    paddingHorizontal: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_primary: { backgroundColor: colors.primary },
  btn_secondary: { backgroundColor: colors.roseBg, borderWidth: 1, borderColor: '#fecdd3' },
  btn_ghost: { backgroundColor: 'transparent' },
  btn_danger: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  btnText: { fontWeight: '700', fontSize: 15 },
  btnText_primary: { color: '#fff' },
  btnText_secondary: { color: colors.primaryDark },
  btnText_ghost: { color: colors.muted },
  btnText_danger: { color: '#b91c1c' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.l,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4, marginTop: spacing.m },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: radius.m,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
});
