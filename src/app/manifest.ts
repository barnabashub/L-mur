import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kettesben — randiötletek pároknak',
    short_name: 'Kettesben',
    description:
      'Páros randiötlet-gyűjtemény és randinapló: inspiráció, bakancslisták, közös emlékek és partnerkedvezmények.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#e11d48',
    lang: 'hu',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
