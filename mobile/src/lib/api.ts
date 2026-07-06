/**
 * L’mur REST API (v1) kliens.
 * Az API alap-URL-je az EXPO_PUBLIC_API_URL környezeti változóval adható meg
 * (fejlesztésnél pl. a gépeden futó szerver LAN-címe: http://192.168.1.10:3000).
 */

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const BASE = `${API_URL}/api/v1`;

export type IdeaSummary = {
  id: string;
  title: string;
  category: string;
  imagePath: string | null;
  locationName: string | null;
  isLocationIndependent: boolean;
  isSeasonal: boolean;
  seasonLabel: string | null;
  avg: number | null;
  reviewCount: number;
  completionCount: number;
  hasDiscount: boolean;
  accessibility?: string[];
};

export type IdeaDetail = IdeaSummary & {
  description: string;
  submitterName: string;
  createdAt: string;
  updatedAt: string;
  partner: { name: string; discountText: string; couponCode: string | null } | null;
  reviews: { id: string; stars: number; text: string | null; userName: string; mine: boolean; createdAt: string }[];
  myCompletions: { id: string; date: string; imagePath: string | null; publicText: string | null; privateText: string | null }[];
  publicCompletions: { id: string; date: string; userName: string; imagePath: string | null; publicText: string | null; privateText: string | null }[];
};

export type ListSummary = { id: string; title: string; description: string | null; isSystem: boolean; total: number; done: number };
export type ListDetail = {
  id: string; title: string; description: string | null; isSystem: boolean; isOwner: boolean;
  items: { itemId: string; id: string; title: string; category: string; imagePath: string | null; locationName: string | null; isLocationIndependent: boolean; avg: number | null; completionCount: number; completed: boolean }[];
};
export type JournalEntry = {
  kind: 'completion' | 'memory'; id: string; date: string; title: string; ideaId: string | null;
  imagePath: string | null; publicText: string | null; privateText: string | null; byName: string; mine: boolean;
};
export type Me = {
  id: string; name: string; email: string; role: string; emailVerified: boolean; createdAt: string;
  partner: { id: string; name: string } | null; inviteCode: string | null;
  stats: { completionCount: number; ideaCount: number; listCount: number };
};
export type AppNotification = { id: string; type: string; message: string; read: boolean; createdAt: string };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, opts: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body && typeof opts.body === 'string') headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error ?? `Hiba történt (${res.status}).`);
  return json.data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; name: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: { id: string; name: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  me: (token: string) => request<Me>('/me', {}, token),

  ideas: (params: { q?: string; kategoria?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.kategoria) qs.set('kategoria', params.kategoria);
    const s = qs.toString();
    return request<IdeaSummary[]>(`/ideas${s ? `?${s}` : ''}`);
  },
  idea: (id: string, token?: string | null) => request<IdeaDetail>(`/ideas/${id}`, {}, token),
  submitIdea: (token: string, data: object) =>
    request<{ id: string; status: string }>('/ideas', { method: 'POST', body: JSON.stringify(data) }, token),
  complete: (token: string, ideaId: string, form: FormData) =>
    request<{ id: string }>(`/ideas/${ideaId}/complete`, { method: 'POST', body: form }, token),
  review: (token: string, ideaId: string, stars: number, text: string) =>
    request<{ id: string }>(`/ideas/${ideaId}/review`, { method: 'POST', body: JSON.stringify({ stars, text }) }, token),

  lists: (token?: string | null) => request<ListSummary[]>('/lists', {}, token),
  list: (id: string, token?: string | null) => request<ListDetail>(`/lists/${id}`, {}, token),
  createList: (token: string, title: string, description?: string) =>
    request<{ id: string }>('/lists', { method: 'POST', body: JSON.stringify({ title, description }) }, token),
  addToList: (token: string, listId: string, ideaId: string) =>
    request<{ itemId: string }>(`/lists/${listId}/items`, { method: 'POST', body: JSON.stringify({ ideaId }) }, token),

  journal: (token: string) => request<JournalEntry[]>('/journal', {}, token),
  addMemory: (token: string, data: { title: string; date: string; text?: string }) =>
    request<{ id: string }>('/journal', { method: 'POST', body: JSON.stringify(data) }, token),

  notifications: (token: string) => request<AppNotification[]>('/notifications', {}, token),
  markAllRead: (token: string) => request<{ ok: true }>('/notifications', { method: 'POST' }, token),

  couple: (token: string, body: { action: 'invite' } | { action: 'join'; code: string } | { action: 'leave' }) =>
    request<{ inviteCode?: string; partnerName?: string | null; left?: boolean }>(
      '/couple',
      { method: 'POST', body: JSON.stringify(body) },
      token
    ),
};

/** Relatív képútvonal → teljes URL a szerverre. */
export function imageUrl(path: string | null): string | null {
  return path ? `${API_URL}${path}` : null;
}
