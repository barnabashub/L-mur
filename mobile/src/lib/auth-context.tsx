import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api, type Me } from './api';

/** A token tárolása: natívan SecureStore, weben localStorage. */
const TOKEN_KEY = 'kettesben_token';

async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
  return SecureStore.getItemAsync(TOKEN_KEY);
}
async function storeToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) globalThis.localStorage?.setItem(TOKEN_KEY, token);
    else globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

type AuthState = {
  token: string | null;
  me: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await loadToken();
        if (stored) {
          setToken(stored);
          setMe(await api.me(stored));
        }
      } catch {
        await storeToken(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyToken = async (t: string) => {
    await storeToken(t);
    setToken(t);
    setMe(await api.me(t));
  };

  const value: AuthState = {
    token,
    me,
    loading,
    login: async (email, password) => {
      const res = await api.login(email, password);
      await applyToken(res.token);
    },
    register: async (name, email, password) => {
      const res = await api.register(name, email, password);
      await applyToken(res.token);
    },
    logout: async () => {
      await storeToken(null);
      setToken(null);
      setMe(null);
    },
    refreshMe: async () => {
      if (token) setMe(await api.me(token));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth csak AuthProvider alatt használható');
  return ctx;
}
