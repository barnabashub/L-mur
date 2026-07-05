import Link from 'next/link';
import { db } from '@/lib/db';
import { fetchApprovedIdeas } from '@/lib/ideas';
import { isInSeason, pickOfTheDay } from '@/lib/discover';
import { IdeaCard } from '@/components/IdeaCard';
import { IdeaImage } from '@/components/IdeaImage';
import { Flash } from '@/components/Flash';
import { Logo } from '@/components/Logo';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const sp = await searchParams;
  const [top, ideaCount, completionCount, coupleCount] = await Promise.all([
    fetchApprovedIdeas({ rendezes: 'ertekeles' }),
    db.dateIdea.count({ where: { status: 'APPROVED' } }),
    db.completion.count(),
    db.couple.count(),
  ]);
  const today = new Date();
  const daily = pickOfTheDay(top, today);
  const seasonal = top.filter((i) => i.isSeasonal && isInSeason(i.seasonMonths, today)).slice(0, 3);

  return (
    <div className="space-y-14">
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-600 px-6 py-16 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-violet-400/30 blur-3xl" />
        <div className="relative">
          <Logo className="mx-auto h-24 w-24 drop-shadow-lg" />
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Randizzatok úgy,{' '}
            <span className="bg-gradient-to-r from-lime-300 to-amber-300 bg-clip-text text-transparent">
              mintha most jöttetek volna össze
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-violet-100">
            Szép helyek, események és otthoni ötletek minden korosztályú párnak. Bakancslista,
            pipa, közös emlék — nem csak az összejövést segítjük, az együtt maradást is.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/otletek" className="btn bg-white px-6 py-3 text-base text-violet-700 shadow-xl hover:bg-violet-50">
              Böngészem az ötleteket
            </Link>
            <Link href="/regisztracio" className="btn border-2 border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
              Csatlakozunk 💜
            </Link>
          </div>
          <dl className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4 text-center">
            {[
              [ideaCount, 'randiötlet'],
              [completionCount, 'kipipált randi'],
              [coupleCount, 'összekapcsolt pár'],
            ].map(([n, label]) => (
              <div key={label as string} className="rounded-3xl bg-white/10 py-3 backdrop-blur">
                <dd className="text-3xl font-black text-lime-300">{n as number}</dd>
                <dt className="text-xs font-medium text-violet-100">{label as string}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {daily && (
        <section>
          <h2 className="mb-4 text-xl font-bold">💡 Az ötlet a mai napra</h2>
          <Link href={`/otletek/${daily.id}`} className="card group grid overflow-hidden transition hover:shadow-md sm:grid-cols-[280px_1fr]">
            <IdeaImage imagePath={daily.imagePath} category={daily.category} title={daily.title} className="h-44 w-full sm:h-full" />
            <div className="space-y-2 p-6">
              <span className="badge-brand">{daily.category}</span>
              <h3 className="text-2xl font-bold text-ink group-hover:text-brand">{daily.title}</h3>
              <p className="line-clamp-3 text-sm text-mute">{daily.description}</p>
              <p className="text-sm font-medium text-brand">Megnézem →</p>
            </div>
          </Link>
        </section>
      )}

      {seasonal.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">📅 Épp aktuális — ne maradjatok le róla!</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {seasonal.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">A legjobbra értékelt ötletek</h2>
          <Link href="/otletek" className="text-sm font-medium text-brand hover:underline">
            Összes ötlet →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {top.slice(0, 6).map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        {[
          ['📝', 'Bakancslista', 'Válogassatok a gyári listákból, vagy építsetek sajátot a közös terveitekből.'],
          ['📸', 'Randinapló', 'Minden kipipált randihoz kép és emlék tartozik — csak kettőtöknek.'],
          ['🎟️', 'Kedvezmények', 'Partnereinknél — váraktól a nemzeti parkokig — kedvezményt kaptok a randikhoz.'],
        ].map(([emoji, title, text]) => (
          <div key={title} className="card p-6">
            <div className="text-3xl">{emoji}</div>
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-mute">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
