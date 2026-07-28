'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Place } from '@/lib/geocode-utils';
import { formatLatLng } from '@/lib/geocode-utils';

const MapView = dynamic(() => import('./MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-blob border border-edge bg-soft text-sm text-mute">
      Térkép betöltése…
    </div>
  ),
});

type Props = {
  defaultLocationName?: string | null;
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultLocationIndependent?: boolean;
};

/**
 * Helyszínválasztó: keresés (OpenStreetMap) + valódi térkép.
 * A felhasználónak nem kell koordinátát írnia — rákeres a helyre vagy
 * a térképre kattint; a rejtett mezők (locationName, lat, lng) töltődnek.
 */
export function LocationPicker({
  defaultLocationName,
  defaultLat,
  defaultLng,
  defaultLocationIndependent = false,
}: Props) {
  const [independent, setIndependent] = useState(defaultLocationIndependent);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(defaultLocationName ?? '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    defaultLat != null && defaultLng != null ? { lat: defaultLat, lng: defaultLng } : null
  );
  const reqId = useRef(0);

  const search = useCallback(async () => {
    const q = query.trim();
    if (q.length < 3) {
      setError('Írj be legalább 3 karaktert.');
      return;
    }
    const id = ++reqId.current;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (id !== reqId.current) return;
      if (!res.ok) throw new Error(json.error ?? 'A keresés nem sikerült.');
      setResults(json.data);
      if (json.data.length === 0) setError('Nincs találat — próbáld pontosabban, pl. „Zamat kávézó Budapest".');
    } catch (e) {
      if (id === reqId.current) setError((e as Error).message);
    } finally {
      if (id === reqId.current) setBusy(false);
    }
  }, [query]);

  const choose = (p: Place) => {
    setName(p.name);
    setCoords({ lat: p.lat, lng: p.lng });
    setResults([]);
  };

  /** Térképre kattintás → visszakeressük a hely nevét. */
  const pickOnMap = useCallback(async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setError(null);
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      if (res.ok && json.data?.[0]) setName(json.data[0].name);
    } catch {
      /* a koordináta már megvan, a nevet a felhasználó beírhatja */
    }
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError('A böngésződ nem támogatja a helymeghatározást.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        pickOnMap(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setBusy(false);
        setError('Nem sikerült lekérni a helyzetedet.');
      },
      { timeout: 8000 }
    );
  };

  // Enter a keresőben ne küldje el az egész űrlapot.
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      search();
    }
  };

  useEffect(() => {
    if (independent) setResults([]);
  }, [independent]);

  return (
    <div className="space-y-3">
      <input type="hidden" name="locationName" value={independent ? '' : name} />
      <input type="hidden" name="lat" value={independent || !coords ? '' : String(coords.lat)} />
      <input type="hidden" name="lng" value={independent || !coords ? '' : String(coords.lng)} />

      <label className="flex items-center gap-2 text-sm text-ink/90">
        <input
          type="checkbox"
          name="isLocationIndependent"
          checked={independent}
          onChange={(e) => setIndependent(e.target.checked)}
          className="accent-violet-500"
        />
        🌍 Helyfüggetlen ötlet (bárhol megvalósítható)
      </label>

      {!independent && (
        <>
          <div>
            <label className="label" htmlFor="helykereso">
              Helyszín keresése
            </label>
            <div className="flex gap-2">
              <input
                className="input"
                id="helykereso"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="pl. Halászbástya, vagy Zamat kávézó Budapest"
                aria-describedby="helykereso-sugo"
              />
              <button type="button" className="btn-secondary shrink-0" onClick={search} disabled={busy}>
                {busy ? '…' : '🔎 Keresés'}
              </button>
              <button
                type="button"
                className="btn-ghost shrink-0"
                onClick={locateMe}
                title="Itt vagyok most"
                aria-label="Jelenlegi helyzetem használata"
              >
                📍
              </button>
            </div>
            <p id="helykereso-sugo" className="mt-1 text-xs text-mute">
              Keress rá a helyre, vagy kattints/koppints a térképre. A találatokat az
              OpenStreetMap adja.
            </p>
          </div>

          {error && <p className="flash-err">{error}</p>}

          {results.length > 0 && (
            <ul className="divide-y divide-edge overflow-hidden rounded-blob border border-edge">
              {results.map((p, i) => (
                <li key={`${p.lat}-${p.lng}-${i}`}>
                  <button
                    type="button"
                    onClick={() => choose(p)}
                    className="block w-full px-4 py-2.5 text-left hover:bg-soft"
                  >
                    <span className="block text-sm font-semibold text-ink">{p.name}</span>
                    <span className="block text-xs text-mute">{p.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <MapView
            markers={coords ? [{ id: 'pick', lat: coords.lat, lng: coords.lng, title: name || 'Kiválasztott hely' }] : []}
            center={coords ?? undefined}
            zoom={coords ? 15 : 7}
            height={320}
            onPick={pickOnMap}
            ariaLabel="Helyválasztó térkép — kattints a helyszínre"
          />

          <div>
            <label className="label" htmlFor="locationLabel">
              A helyszín neve (szerkeszthető)
            </label>
            <input
              className="input"
              id="locationLabel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={160}
              placeholder="pl. Budapest, Halászbástya"
            />
            <p className="mt-1 text-xs text-mute" aria-live="polite">
              {coords
                ? `✔ Kiválasztott pont: ${formatLatLng(coords.lat, coords.lng)}`
                : 'Még nincs kiválasztva pont a térképen (a név önmagában is elég).'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
