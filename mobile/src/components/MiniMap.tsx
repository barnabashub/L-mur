import React from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { radius, spacing, useTheme } from '../lib/theme';

/**
 * Valódi térkép a mobilon: Leaflet + OpenStreetMap egy WebView-ban.
 * Miért nem react-native-maps? Az Androidon Google Maps API-kulcsot igényelne;
 * így viszont kulcs és külön kiadási lépés nélkül működik mindkét platformon.
 */
export function MiniMap({
  lat,
  lng,
  title,
  height = 220,
}: {
  lat: number;
  lng: number;
  title: string;
  height?: number;
}) {
  const t = useTheme();
  const dark = t.bg === '#0e0c16';

  const html = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
  html,body,#map{margin:0;height:100%;background:${t.card}}
  .pin{width:22px;height:22px;border-radius:999px;background:${t.primary};
       border:3px solid ${t.card};box-shadow:0 0 0 2px ${t.primary}55}
  ${dark ? '.leaflet-tile-pane{filter:brightness(.75) saturate(.85) contrast(1.05)}' : ''}
  .leaflet-control-attribution{font-size:9px}
</style></head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([${lat}, ${lng}], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  L.marker([${lat}, ${lng}], {
    icon: L.divIcon({ className: '', html: '<span class="pin"></span>', iconSize: [22,22], iconAnchor: [11,11] })
  }).addTo(map);
</script></body></html>`;

  const openNative = () => {
    // A telefon saját térképalkalmazása (iOS: Térképek, Android: geo: kezelő).
    const url = Platform.select({
      ios: `maps://?ll=${lat},${lng}&q=${encodeURIComponent(title)}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(title)})`,
      default: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
    });
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)
    );
  };

  return (
    <View style={{ gap: spacing.s }}>
      <View
        style={{ height, borderRadius: radius.l, overflow: 'hidden', borderWidth: 1, borderColor: t.border }}
        accessible
        accessibilityLabel={`${title} a térképen`}
      >
        {Platform.OS === 'web' ? (
          // A react-native-webview nem támogatja a webet — ott sima iframe.
          React.createElement('iframe', {
            srcDoc: html,
            style: { width: '100%', height: '100%', border: 'none' },
            title: `${title} a térképen`,
          })
        ) : (
          <WebView
            source={{ html }}
            originWhitelist={['*']}
            style={{ backgroundColor: t.card }}
            scrollEnabled={false}
          />
        )}
      </View>
      <Pressable
        onPress={openNative}
        accessibilityRole="button"
        accessibilityLabel="Útvonaltervezés a térképalkalmazásban"
        style={{
          alignSelf: 'flex-start',
          backgroundColor: t.roseBg,
          paddingHorizontal: spacing.l,
          paddingVertical: 10,
          borderRadius: radius.m,
        }}
      >
        <Text style={{ color: t.primaryDark, fontWeight: '800', fontSize: 14 }}>🧭 Útvonaltervezés</Text>
      </Pressable>
    </View>
  );
}
