import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, coupleUserIds, partnerOf } from '@/lib/auth';
import { formatDate, toInputDate } from '@/lib/format';
import { addMemory, deleteMemory } from '@/lib/actions/journal';
import { deleteCompletion } from '@/lib/actions/ideas';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Randinaplónk' };

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const memberIds = coupleUserIds(user);
  const partner = partnerOf(user);

  const [completions, memories] = await Promise.all([
    db.completion.findMany({
      where: { userId: { in: memberIds } },
      include: {
        idea: { select: { id: true, title: true, category: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    db.memory.findMany({
      where: { userId: { in: memberIds } },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  type Entry =
    | { kind: 'completion'; date: Date; item: (typeof completions)[number] }
    | { kind: 'memory'; date: Date; item: (typeof memories)[number] };

  const entries: Entry[] = [
    ...completions.map((c) => ({ kind: 'completion' as const, date: c.date, item: c })),
    ...memories.map((m) => ({ kind: 'memory' as const, date: m.date, item: m })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Randinaplónk 🔒</h1>
        <p className="text-sm text-stone-500">
          {partner
            ? `Csak ti ketten látjátok — ${user.name} és ${partner.name} közös emlékei.`
            : 'Csak te látod. Ha összekapcsolódtok a pároddal, közös naplótok lesz.'}
          {!partner && (
            <>
              {' '}
              <Link href="/par" className="font-medium text-rose-600 hover:underline">Pár összekapcsolása →</Link>
            </>
          )}
        </p>
      </div>
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      <details className="card p-6">
        <summary className="cursor-pointer font-semibold text-stone-800">
          + Appon kívüli randi megörökítése
        </summary>
        <p className="mt-1 text-sm text-stone-500">
          Olyan randi, ami nem az appból jött, de szeretnétek, hogy megmaradjon emlékbe.
        </p>
        <form action={addMemory} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" name="title" required minLength={2} maxLength={120} placeholder="Mi volt a randi?" />
            <input className="input" type="date" name="date" defaultValue={toInputDate(new Date())} required />
          </div>
          <textarea className="input" name="text" rows={3} placeholder="Hogy emlékeztek rá?" />
          <input className="input" type="file" name="image" accept="image/*" />
          <button className="btn-primary">Mentés a naplóba</button>
        </form>
      </details>

      {entries.length === 0 ? (
        <p className="card p-10 text-center text-stone-500">
          A naplótok még üres. Pipáljatok ki egy <Link href="/otletek" className="text-rose-600 hover:underline">randiötletet</Link>,
          vagy örökítsetek meg egy appon kívüli randit!
        </p>
      ) : (
        <ol className="relative space-y-6 border-l-2 border-rose-100 pl-6">
          {entries.map((entry) => {
            const isOwn = entry.item.user.id === user.id;
            return (
              <li key={`${entry.kind}-${entry.item.id}`} className="relative">
                <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] text-white">
                  {entry.kind === 'completion' ? '✔' : '✎'}
                </span>
                <article className="card overflow-hidden">
                  {entry.item.imagePath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.item.imagePath} alt="" className="max-h-72 w-full object-cover" />
                  )}
                  <div className="space-y-2 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-rose-500">
                      {formatDate(entry.date)} · {entry.item.user.name}
                      {entry.kind === 'memory' && ' · appon kívüli emlék'}
                    </p>
                    {entry.kind === 'completion' ? (
                      <>
                        <h3 className="font-semibold">
                          <Link href={`/otletek/${entry.item.idea.id}`} className="hover:text-rose-700">
                            {entry.item.idea.title}
                          </Link>
                        </h3>
                        {entry.item.publicText && <p className="text-sm text-stone-700">{entry.item.publicText}</p>}
                        {entry.item.privateText && (
                          <p className="rounded-lg bg-rose-50/70 px-3 py-2 text-sm text-stone-700">
                            🔒 {entry.item.privateText}
                          </p>
                        )}
                        {!entry.item.imagePublic && entry.item.imagePath && (
                          <p className="text-xs text-stone-400">A fotó privát — csak itt, a naplóban látszik.</p>
                        )}
                        {isOwn && (
                          <form action={deleteCompletion} className="text-right">
                            <input type="hidden" name="id" value={entry.item.id} />
                            <button className="text-xs text-stone-400 hover:text-red-600">Törlés</button>
                          </form>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold">{entry.item.title}</h3>
                        {entry.item.text && <p className="text-sm text-stone-700">{entry.item.text}</p>}
                        {isOwn && (
                          <form action={deleteMemory} className="text-right">
                            <input type="hidden" name="id" value={entry.item.id} />
                            <button className="text-xs text-stone-400 hover:text-red-600">Törlés</button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
