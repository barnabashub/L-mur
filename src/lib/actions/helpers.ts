import 'server-only';
import { redirect } from 'next/navigation';
import { isValidLatLng } from '@/lib/geocode-utils';

/** Hibaüzenettel visszairányít az űrlap oldalára (?hiba=...). */
export function failTo(path: string, message: string): never {
  const sep = path.includes('?') ? '&' : '?';
  redirect(`${path}${sep}hiba=${encodeURIComponent(message)}`);
}

/** Sikerüzenettel irányít tovább (?uzenet=...). */
export function okTo(path: string, message?: string): never {
  if (!message) redirect(path);
  const sep = path.includes('?') ? '&' : '?';
  redirect(`${path}${sep}uzenet=${encodeURIComponent(message)}`);
}

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on' || fd.get(key) === 'true';
}

/** Több azonos nevű checkbox értékei, engedélyezett kulcsokra szűrve. */
export function multi(fd: FormData, key: string, allowed: readonly string[]): string | null {
  const values = fd.getAll(key).filter((v): v is string => typeof v === 'string' && allowed.includes(v));
  return values.length ? values.join(',') : null;
}

/**
 * A helyválasztó rejtett lat/lng mezői. Üres → null (a helyszín név
 * önmagában is elég); érvénytelen érték → hiba a hívónak.
 */
export function coords(fd: FormData): { lat: number | null; lng: number | null; ok: boolean } {
  const lat = str(fd, 'lat');
  const lng = str(fd, 'lng');
  if (!lat || !lng) return { lat: null, lng: null, ok: true };
  if (!isValidLatLng(lat, lng)) return { lat: null, lng: null, ok: false };
  return { lat: Number(lat), lng: Number(lng), ok: true };
}
