/**
 * Geokódolás tiszta (hálózat nélküli) segédfüggvényei — egységtesztelve.
 */

export type NominatimPlace = {
  lat: string;
  lon: string;
  display_name?: string;
  name?: string;
  type?: string;
  address?: Record<string, string>;
};

export type Place = {
  name: string;
  detail: string;
  lat: number;
  lng: number;
};

const CITY_KEYS = ['city', 'town', 'village', 'municipality', 'county'];

/**
 * Nominatim találatból emberi helynév: „Halászbástya, Budapest".
 * A `name` mező a POI neve; ha nincs, a display_name első eleme.
 */
export function toPlace(r: NominatimPlace): Place | null {
  const lat = Number(r.lat);
  const lng = Number(r.lon);
  if (!isFinite(lat) || !isFinite(lng)) return null;

  const parts = (r.display_name ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  const primary = r.name?.trim() || parts[0] || 'Ismeretlen hely';
  const city = CITY_KEYS.map((k) => r.address?.[k]).find(Boolean);
  const name = city && city !== primary ? `${primary}, ${city}` : primary;

  return {
    name,
    detail: parts.slice(1).join(', ') || (r.display_name ?? ''),
    lat,
    lng,
  };
}

/**
 * Koordináta érvényessége (WGS84).
 * A null/undefined/üres érték NEM érvényes — a Number() ezeket 0-vá alakítaná,
 * ami hamis „0,0" koordinátát eredményezne.
 */
export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  const empty = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
  if (empty(lat) || empty(lng)) return false;
  const a = Number(lat);
  const b = Number(lng);
  return isFinite(a) && isFinite(b) && a >= -90 && a <= 90 && b >= -180 && b <= 180;
}

/** Megjelenítéshez: 5 tizedes (kb. 1 m pontosság) — a tárolt érték teljes marad. */
export function formatLatLng(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
