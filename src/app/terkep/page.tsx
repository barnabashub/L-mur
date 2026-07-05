import Link from 'next/link';
import { db } from '@/lib/db';
import { avgStars } from '@/lib/ideas';
import { Stars } from '@/components/Stars';

export const metadata = { title: 'Térkép' };

/**
 * Stilizált, önálló SVG-térkép (Magyarország), külső csempeszolgáltatás nélkül.
 * Prodban Leaflet + OpenStreetMap-re cserélhető — a koordináták már a modellben vannak.
 */
const LNG_MIN = 16.0, LNG_MAX = 23.0, LAT_MIN = 45.6, LAT_MAX = 48.7;
const W = 800, H = 460;

function project(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H,
  };
}

// Egyszerűsített országhatár (stilizált).
const HU_OUTLINE: [number, number][] = [
  [48.10, 16.95], [48.35, 17.25], [48.40, 18.75], [48.58, 19.90], [48.55, 20.50],
  [48.40, 21.10], [48.55, 22.15], [48.35, 22.85], [47.95, 22.90], [47.55, 22.45],
  [46.95, 21.65], [46.60, 21.30], [46.25, 21.15], [46.15, 20.65], [46.15, 19.55],
  [45.90, 19.05], [45.80, 18.65], [45.75, 18.10], [45.95, 17.35], [46.40, 16.60],
  [46.85, 16.10], [47.05, 16.45], [47.50, 16.40], [47.70, 16.55], [47.75, 17.05],
];

export default async function MapPage() {
  const ideas = await db.dateIdea.findMany({
    where: { status: 'APPROVED', lat: { not: null }, lng: { not: null } },
    include: { reviews: { select: { stars: true } }, partner: { select: { id: true } } },
    orderBy: { title: 'asc' },
  });

  const outlinePoints = HU_OUTLINE.map(([lat, lng]) => {
    const p = project(lat, lng);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Randitérkép 🗺️</h1>
        <p className="text-sm text-stone-500">
          Helyhez kötött ötleteink az országban — kattints egy pontra! A helyfüggetlen ötleteket az{' '}
          <Link href="/otletek?hely=helyfuggetlen" className="text-rose-600 hover:underline">
            ötletböngészőben
          </Link>{' '}
          találod.
        </p>
      </div>

      <div className="card overflow-x-auto p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-3xl" role="img" aria-label="Magyarország-térkép a randiötletekkel">
          <polygon points={outlinePoints} fill="#fff1f2" stroke="#fda4af" strokeWidth="2" strokeLinejoin="round" />
          {ideas.map((idea) => {
            const p = project(idea.lat!, idea.lng!);
            return (
              <Link key={idea.id} href={`/otletek/${idea.id}`}>
                <g className="cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="10" fill="#e11d48" opacity="0.25" />
                  <circle cx={p.x} cy={p.y} r="5" fill="#e11d48" />
                  <title>{idea.title} — {idea.locationName}</title>
                </g>
              </Link>
            );
          })}
        </svg>
        <p className="mt-2 text-center text-xs text-stone-400">
          Stilizált térkép — a pontok elhelyezkedése hozzávetőleges.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ideas.map((idea) => (
          <Link key={idea.id} href={`/otletek/${idea.id}`} className="card flex items-center gap-3 p-4 transition hover:shadow-md">
            <span className="text-xl">📍</span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-stone-900">{idea.title}</p>
              <p className="truncate text-xs text-stone-500">{idea.locationName}</p>
            </div>
            <span className="ml-auto shrink-0">
              <Stars value={avgStars(idea.reviews)} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
