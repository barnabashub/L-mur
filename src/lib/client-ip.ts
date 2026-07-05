import 'server-only';
import { headers } from 'next/headers';

/** A kliens IP-je a szokásos proxy-fejlécekből (best effort). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-real-ip') ||
    'ismeretlen'
  );
}
