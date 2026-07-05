import Link from 'next/link';
import { db } from '@/lib/db';
import { getCurrentUser, coupleUserIds } from '@/lib/auth';
import { createList } from '@/lib/actions/lists';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Bakancslisták' };

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  const lists = await db.bucketList.findMany({
    where: { OR: [{ isSystem: true }, ...(user ? [{ ownerId: user.id }] : [])] },
    include: { items: { select: { ideaId: true } } },
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
  });

  // A pár közös teljesítései — a haladásjelzőkhöz.
  const completedIdeaIds = user
    ? new Set(
        (
          await db.completion.findMany({
            where: { userId: { in: coupleUserIds(user) } },
            select: { ideaId: true },
          })
        ).map((c) => c.ideaId)
      )
    : new Set<string>();

  const renderCard = (list: (typeof lists)[number]) => {
    const done = list.items.filter((i) => completedIdeaIds.has(i.ideaId)).length;
    const total = list.items.length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return (
      <Link key={list.id} href={`/bakancslistak/${list.id}`} className="card group block p-5 transition hover:shadow-md">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-ink group-hover:text-brand">
            {list.isSystem && '⭐ '}{list.title}
          </h3>
          <span className="badge-soft">{total} ötlet</span>
        </div>
        {list.description && <p className="mt-1 text-sm text-mute">{list.description}</p>}
        {user && total > 0 && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-soft">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-mute">{done}/{total} teljesítve ({pct}%)</p>
          </div>
        )}
      </Link>
    );
  };

  const systemLists = lists.filter((l) => l.isSystem);
  const ownLists = lists.filter((l) => !l.isSystem);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Bakancslisták</h1>
        <p className="text-sm text-mute">
          Válogatott gyűjtemények tőlünk, és a saját közös terveitek egy helyen.
        </p>
      </div>
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      <section>
        <h2 className="mb-4 text-lg font-bold">Gyári listák</h2>
        <div className="grid gap-4 sm:grid-cols-2">{systemLists.map(renderCard)}</div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">Saját listáitok</h2>
        {user ? (
          <>
            {ownLists.length > 0 ? (
              <div className="mb-6 grid gap-4 sm:grid-cols-2">{ownLists.map(renderCard)}</div>
            ) : (
              <p className="mb-6 text-sm text-mute">Még nincs saját listátok — hozzatok létre egyet!</p>
            )}
            <form action={createList} className="card grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto]">
              <input className="input" name="title" required minLength={3} maxLength={120}
                placeholder="A lista neve (pl. Nagy közös terveink)" />
              <input className="input" name="description" maxLength={300} placeholder="Rövid leírás (opcionális)" />
              <button className="btn-primary">+ Lista létrehozása</button>
            </form>
          </>
        ) : (
          <p className="card p-6 text-sm text-mute">
            Saját bakancslistához <Link href="/belepes" className="font-medium text-brand hover:underline">lépj be</Link>{' '}
            vagy <Link href="/regisztracio" className="font-medium text-brand hover:underline">regisztrálj</Link>.
          </p>
        )}
      </section>
    </div>
  );
}
