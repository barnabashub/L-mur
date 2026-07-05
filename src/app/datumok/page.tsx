import { db } from '@/lib/db';
import { requireUser, coupleUserIds } from '@/lib/auth';
import { upcomingAnniversaries } from '@/lib/dates';
import { formatDate } from '@/lib/format';
import { addImportantDate, deleteImportantDate } from '@/lib/actions/journal';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Fontos dátumaink' };

export default async function DatesPage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const dates = await db.importantDate.findMany({
    where: { userId: { in: coupleUserIds(user) } },
    orderBy: { date: 'asc' },
  });
  const upcoming = upcomingAnniversaries(dates, new Date(), 45);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Fontos dátumaink 📅</h1>
        <p className="text-sm text-stone-500">
          Mentsétek el a nagy napokat — az év- és hónapfordulókra emlékeztetünk.
        </p>
      </div>
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      {upcoming.length > 0 && (
        <section className="card border-rose-200 bg-rose-50/60 p-6">
          <h2 className="font-bold text-rose-900">Közelgő fordulók 🎉</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map((a) => (
              <li key={`${a.id}-${a.kind}-${a.date.toISOString()}`} className="flex flex-wrap items-baseline gap-x-2 text-sm text-rose-900">
                <strong>{a.title}</strong>
                <span>
                  — {a.count}. {a.kind === 'yearly' ? 'évforduló' : 'hónapforduló'}: {formatDate(a.date)}
                </span>
                <span className="badge bg-white text-rose-700">
                  {a.daysAway === 0 ? 'MA VAN! 🥂' : `${a.daysAway} nap múlva`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-6">
        <h2 className="mb-4 font-bold">Új fontos dátum</h2>
        <form action={addImportantDate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" name="title" required minLength={2} maxLength={120}
              placeholder="pl. Megismerkedésünk napja" />
            <input className="input" type="date" name="date" required />
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-stone-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="notifyYearly" defaultChecked className="accent-rose-600" />
              Évfordulóra emlékeztessen
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="notifyMonthly" className="accent-rose-600" />
              Hónapfordulóra is
            </label>
          </div>
          <button className="btn-primary">Mentés</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Elmentett dátumok</h2>
        {dates.length === 0 ? (
          <p className="card p-8 text-center text-sm text-stone-500">Még nincs elmentett dátumotok.</p>
        ) : (
          <ul className="space-y-3">
            {dates.map((d) => (
              <li key={d.id} className="card flex flex-wrap items-center gap-3 p-4 text-sm">
                <div>
                  <p className="font-semibold">{d.title}</p>
                  <p className="text-stone-500">{formatDate(d.date)}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {d.notifyYearly && <span className="badge bg-rose-50 text-rose-700">évforduló</span>}
                  {d.notifyMonthly && <span className="badge bg-sky-50 text-sky-700">hónapforduló</span>}
                  <form action={deleteImportantDate}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="text-xs text-stone-400 hover:text-red-600">Törlés</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
