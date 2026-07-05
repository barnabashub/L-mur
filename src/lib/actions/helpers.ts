import 'server-only';
import { redirect } from 'next/navigation';

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
