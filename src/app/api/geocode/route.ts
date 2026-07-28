import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { reverseGeocode, searchPlaces } from '@/lib/geocode';
import { isValidLatLng } from '@/lib/geocode-utils';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/client-ip';

/**
 * Helykereső proxy a böngészőnek/mobilnak (OpenStreetMap Nominatim mögötte).
 *   GET /api/geocode?q=Halászbástya          → keresés
 *   GET /api/geocode?lat=47.5&lng=19.03      → fordított geokódolás
 * Csak bejelentkezett felhasználóknak, IP-nként korlátozva — a külső
 * szolgáltatás terhelése így kordában marad.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Bejelentkezés szükséges.' }, { status: 401 });

  if (!rateLimit(`geocode:${await clientIp()}`, 30, 60_000).allowed) {
    return NextResponse.json({ error: 'Túl sok keresés — várj egy kicsit.' }, { status: 429 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  try {
    if (q) {
      return NextResponse.json({ data: await searchPlaces(q) });
    }
    if (lat && lng) {
      if (!isValidLatLng(lat, lng)) {
        return NextResponse.json({ error: 'Érvénytelen koordináta.' }, { status: 400 });
      }
      const place = await reverseGeocode(Number(lat), Number(lng));
      return NextResponse.json({ data: place ? [place] : [] });
    }
    return NextResponse.json({ error: 'Adj meg keresőszót vagy koordinátát.' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
