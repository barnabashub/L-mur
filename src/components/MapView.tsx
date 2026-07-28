'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string | null;
  href?: string;
};

/**
 * Valódi térkép (Leaflet + OpenStreetMap csempék).
 * A Leaflet a böngészőben él, ezért dinamikusan töltjük — SSR alatt nincs `window`.
 * Markerekhez képfájl helyett CSS-alapú divIcon, így nincs asset-függőség.
 */
export function MapView({
  markers = [],
  center,
  zoom = 7,
  height = 420,
  onPick,
  className = '',
  ariaLabel = 'Térkép',
}: {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number;
  /** Ha meg van adva, a térképre kattintva helyet lehet választani. */
  onPick?: (lat: number, lng: number) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<Marker[]>([]);
  const pick = useRef(onPick);
  pick.current = onPick;

  // Térkép létrehozása (egyszer).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !holder.current || map.current) return;

      const instance = L.map(holder.current, {
        center: [center?.lat ?? 47.16, center?.lng ?? 19.5],
        zoom,
        scrollWheelZoom: false, // görgetéskor ne "nyelje el" az oldalgörgetést
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> közreműködők',
      }).addTo(instance);

      if (pick.current) {
        instance.on('click', (e) => pick.current?.(e.latlng.lat, e.latlng.lng));
      }
      map.current = instance;
      // A konténer méretét a beillesztés után is újraszámoltatjuk.
      setTimeout(() => instance.invalidateSize(), 60);
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markerek szinkronizálása.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !map.current) return;

      layer.current.forEach((m) => m.remove());
      layer.current = [];

      const icon = L.divIcon({
        className: '',
        html: '<span class="lmur-pin"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -10],
      });

      for (const m of markers) {
        const marker = L.marker([m.lat, m.lng], { icon, title: m.title, alt: m.title }).addTo(map.current);
        const body = [
          `<strong>${escapeHtml(m.title)}</strong>`,
          m.subtitle ? `<br><span style="opacity:.75">${escapeHtml(m.subtitle)}</span>` : '',
          m.href ? `<br><a href="${m.href}" style="font-weight:600">Megnézem →</a>` : '',
        ].join('');
        marker.bindPopup(body);
        layer.current.push(marker);
      }

      if (markers.length > 1 && !center) {
        map.current.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), { padding: [30, 30] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [markers, center]);

  // Középpont/zoom követése (helyválasztónál a kereső mozgatja).
  useEffect(() => {
    if (map.current && center) map.current.setView([center.lat, center.lng], Math.max(map.current.getZoom(), 14));
  }, [center]);

  return (
    <div
      ref={holder}
      className={`lmur-map w-full overflow-hidden rounded-blob border border-edge ${className}`}
      style={{ height }}
      role="application"
      aria-label={ariaLabel}
    />
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}
