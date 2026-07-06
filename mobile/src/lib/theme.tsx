/**
 * L’mur mobil — témák. A rendszer világos/sötét beállítását követi.
 * A palettát a ThemeProvider osztja szét kontextusban, így az egész fa
 * garantáltan ugyanazt a témát látja (weben a matchMedia-t figyeljük
 * közvetlenül, mert a react-native-web useColorScheme statikus exportban
 * megbízhatatlan).
 */
import React, { useSyncExternalStore } from 'react';
import { Appearance, Platform } from 'react-native';

const light = {
  primary: '#7c3aed',
  primaryDark: '#6d28d9',
  gradientEnd: '#d946ef',
  bg: '#f7f6fc',
  card: '#ffffff',
  border: '#e6e3f3',
  text: '#1e1b2c',
  muted: '#6c6884',
  faint: '#9e9ab6',
  amber: '#b45309',
  amberBg: '#fef3c7',
  green: '#047857',
  greenBg: '#d1fae5',
  roseBg: '#ede9fe', // brand-soft
  star: '#f59e0b',
  accent: '#65a30d',
  onPrimary: '#ffffff',
};

const dark: typeof light = {
  primary: '#a78bfa',
  primaryDark: '#8b5cf6',
  gradientEnd: '#e879f9',
  bg: '#0e0c16',
  card: '#191626',
  border: '#302b48',
  text: '#f0eefa',
  muted: '#a8a3c2',
  faint: '#7a7596',
  amber: '#fbbf24',
  amberBg: 'rgba(251, 191, 36, 0.12)',
  green: '#34d399',
  greenBg: 'rgba(52, 211, 153, 0.12)',
  roseBg: '#33285e',
  star: '#fbbf24',
  accent: '#a3e635',
  onPrimary: '#17102e',
};

export type Palette = typeof light;

/**
 * A séma közvetlen olvasása useSyncExternalStore-ral: minden komponens a
 * rendszer aktuális beállítását látja, kontextus és provider-azonosság
 * nélkül — így a webes export chunk-duplikációja sem tudja szétcsúsztatni.
 */
function getScheme(): 'light' | 'dark' {
  if (Platform.OS === 'web') {
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

function subscribe(onChange: () => void): () => void {
  if (Platform.OS === 'web') {
    if (typeof matchMedia !== 'function') return () => {};
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }
  const sub = Appearance.addChangeListener(onChange);
  return () => sub.remove();
}

/** Kompatibilitási burkoló — a téma provider nélkül is működik. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme(): Palette {
  const scheme = useSyncExternalStore(subscribe, getScheme, () => 'light' as const);
  return scheme === 'dark' ? dark : light;
}

export const spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24 };
export const radius = { m: 14, l: 22 };
