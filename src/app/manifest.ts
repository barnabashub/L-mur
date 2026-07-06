import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'L’mur — randiötletek pároknak',
    short_name: 'L’mur',
    description:
      'Páros randiötlet-gyűjtemény és randinapló: inspiráció, bakancslisták, közös emlékek és partnerkedvezmények.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0e0c16',
    theme_color: '#7c3aed',
    lang: 'hu',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
