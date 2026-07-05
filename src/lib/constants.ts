export const ROLES = ['USER', 'MODERATOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;
export const IDEA_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export const CATEGORIES = [
  'Természet',
  'Kultúra',
  'Gasztronómia',
  'Aktív / sport',
  'Romantikus',
  'Otthoni',
  'Esemény',
  'Kaland',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Kategóriánkénti szín és emoji a kép nélküli ötletek helykitöltőjéhez. */
export const CATEGORY_META: Record<string, { emoji: string; gradient: string }> = {
  'Természet': { emoji: '🌲', gradient: 'from-emerald-400 to-teal-600' },
  'Kultúra': { emoji: '🏛️', gradient: 'from-amber-400 to-orange-600' },
  'Gasztronómia': { emoji: '🍷', gradient: 'from-rose-400 to-red-600' },
  'Aktív / sport': { emoji: '🚴', gradient: 'from-sky-400 to-blue-600' },
  'Romantikus': { emoji: '💕', gradient: 'from-pink-400 to-rose-600' },
  'Otthoni': { emoji: '🏠', gradient: 'from-violet-400 to-purple-600' },
  'Esemény': { emoji: '🎪', gradient: 'from-fuchsia-400 to-pink-600' },
  'Kaland': { emoji: '🎈', gradient: 'from-orange-400 to-amber-600' },
};

export const SESSION_COOKIE = 'kettesben_session';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
