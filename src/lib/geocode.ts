import 'server-only';
import { toPlace, type NominatimPlace, type Place } from './geocode-utils';

/**
 * OpenStreetMap Nominatim geokódolás — kizárólag szerveroldalról hívva.
 *
 * Miért a szerveren keresztül?
 *  - a Nominatim használati feltételei valós User-Agentet és legfeljebb
 *    1 kérés/másodperc ütemet írnak elő (ezt böngészőből nem lehet betartatni),
 *  - így egy helyen cache-elhetünk, és a felhasználók IP-je sem szivárog ki.
 *
 * Saját Nominatim/Photon példány a GEOCODER_URL env-változóval köthető be.
 */

const BASE = (process.env.GEOCODER_URL ?? 'https://nominatim.openstreetmap.org').replace(/\/$/, '');
const UA = `Lmur/1.0 (${process.env.APP_URL ?? 'http://localhost:3000'})`;

const cache = new Map<string, { at: number; places: Place[] }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_CACHE = 500;

/** Globális ütemezés: a Nominatim felé legfeljebb másodpercenként egy kérés. */
let nextSlot = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + 1100;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

async function call(path: string, params: Record<string, string>): Promise<NominatimPlace[]> {
  await throttle();
  const url = `${BASE}${path}?${new URLSearchParams({ format: 'jsonv2', ...params })}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'hu' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`A helykereső nem elérhető (${res.status}).`);
  const json = await res.json();
  return Array.isArray(json) ? json : [json];
}

function remember(key: string, places: Place[]) {
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), places });
}

/** Szabadszavas helykeresés (pl. „Halászbástya" vagy „Zamat kávézó Budapest"). */
export async function searchPlaces(query: string, limit = 6): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const key = `s:${q.toLowerCase()}:${limit}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.places;

  const raw = await call('/search', {
    q,
    limit: String(limit),
    addressdetails: '1',
    // Előbb a magyar találatok, de a külföldiek sem esnek ki.
    'accept-language': 'hu',
  });
  const places = raw.map(toPlace).filter((p): p is Place => p !== null);
  remember(key, places);
  return places;
}

/** Fordított geokódolás: térképre kattintás → helynév. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place | null> {
  const key = `r:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.places[0] ?? null;

  const raw = await call('/reverse', {
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
    zoom: '17',
  });
  const place = raw.map(toPlace).find((p): p is Place => p !== null) ?? null;
  remember(key, place ? [place] : []);
  return place;
}
