import Link from 'next/link';
import { db } from '@/lib/db';
import { fetchApprovedIdeas } from '@/lib/ideas';
import { IdeaCard } from '@/components/IdeaCard';
import { Flash } from '@/components/Flash';

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

  return (
    <div className="space-y-14">
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      <section className="rounded-3xl bg-gradient-to-br from-rose-600 to-rose-800 px-6 py-14 text-center text-rose-50 sm:px-12">
        <h1 className="text-3xl font-bold sm:text-5xl">Randiötletek kettesben — egy életen át</h1>
        <p className="mx-auto mt-4 max-w-2xl text-rose-100">
          Szép helyek, események és otthoni ötletek minden korosztályú párnak. Gyűjtsétek
          bakancslistába, pipáljátok ki, és őrizzétek meg az emléket a közös randinaplótokban.
          Nem csak az összejövést segítjük — az együtt maradást is.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/otletek" className="btn bg-white text-rose-700 hover:bg-rose-50">
            Böngészem az ötleteket
          </Link>
          <Link href="/regisztracio" className="btn border border-rose-300 text-white hover:bg-rose-700">
            Csatlakozunk
          </Link>
        </div>
        <dl className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-4 text-center">
          {[
            [ideaCount, 'randiötlet'],
            [completionCount, 'kipipált randi'],
            [coupleCount, 'összekapcsolt pár'],
          ].map(([n, label]) => (
            <div key={label as string}>
              <dd className="text-2xl font-bold">{n as number}</dd>
              <dt className="text-xs text-rose-200">{label as string}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">A legjobbra értékelt ötletek</h2>
          <Link href="/otletek" className="text-sm font-medium text-rose-600 hover:underline">
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
            <p className="mt-1 text-sm text-stone-600">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
