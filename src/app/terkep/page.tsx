import Link from 'next/link';
import dynamic from 'next/dynamic';
import { db } from '@/lib/db';
import { avgStars } from '@/lib/ideas';
import { Stars } from '@/components/Stars';

const MapView = dynamic(() => import('@/components/MapView').then((m) => m.MapView), {
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-blob border border-edge bg-soft text-sm text-mute">
      Térkép betöltése…
    </div>
  ),
});

export const metadata = { title: 'Térkép' };

export default async function MapPage() {
  const ideas = await db.dateIdea.findMany({
    where: { status: 'APPROVED', lat: { not: null }, lng: { not: null } },
    include: { reviews: { select: { stars: true } } },
    orderBy: { title: 'asc' },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Randitérkép 🗺️</h1>
        <p className="text-sm text-mute">
          Helyhez kötött ötleteink valódi térképen — kattints egy pontra! A helyfüggetlen
          ötleteket az{' '}
          <Link href="/otletek?hely=helyfuggetlen" className="text-brand hover:underline">
            ötletböngészőben
          </Link>{' '}
          találod.
        </p>
      </div>

      <MapView
        markers={ideas.map((i) => ({
          id: i.id,
          lat: i.lat!,
          lng: i.lng!,
          title: i.title,
          subtitle: i.locationName,
          href: `/otletek/${i.id}`,
        }))}
        height={520}
        ariaLabel="Randiötletek térképe"
      />

      {/* Szöveges alternatíva a térképhez — képernyőolvasóval és billentyűzettel is használható. */}
      <section>
        <h2 className="mb-3 text-lg font-bold">A térkép pontjai listában</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ideas.map((idea) => (
            <Link
              key={idea.id}
              href={`/otletek/${idea.id}`}
              className="card flex items-center gap-3 p-4 transition hover:shadow-md"
            >
              <span className="text-xl" aria-hidden="true">📍</span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{idea.title}</p>
                <p className="truncate text-xs text-mute">{idea.locationName}</p>
              </div>
              <span className="ml-auto shrink-0">
                <Stars value={avgStars(idea.reviews)} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
