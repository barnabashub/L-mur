import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser, coupleUserIds } from '@/lib/auth';
import { avgStars } from '@/lib/ideas';
import { deleteList, removeFromList } from '@/lib/actions/lists';
import { IdeaCard } from '@/components/IdeaCard';
import { Flash } from '@/components/Flash';

export default async function ListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  const list = await db.bucketList.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      items: {
        orderBy: { order: 'asc' },
        include: {
          idea: {
            include: {
              reviews: { select: { stars: true } },
              partner: { select: { id: true, name: true } },
              _count: { select: { completions: true } },
            },
          },
        },
      },
    },
  });
  // Gyári lista mindenkié; saját lista csak a tulajdonosáé.
  if (!list || (!list.isSystem && list.ownerId !== user?.id)) notFound();

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

  const visibleItems = list.items.filter((i) => i.idea.status === 'APPROVED');
  const done = visibleItems.filter((i) => completedIdeaIds.has(i.ideaId)).length;
  const pct = visibleItems.length === 0 ? 0 : Math.round((done / visibleItems.length) * 100);
  const isOwner = !list.isSystem && list.ownerId === user?.id;

  return (
    <div className="space-y-8">
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-faint">
            <Link href="/bakancslistak" className="hover:text-brand">Bakancslisták</Link> /
          </p>
          <h1 className="text-2xl font-bold">{list.isSystem && '⭐ '}{list.title}</h1>
          {list.description && <p className="mt-1 text-mute">{list.description}</p>}
          <p className="mt-1 text-xs text-faint">
            {list.isSystem ? 'Gyári lista a L’mur csapatától' : `Saját listátok`}
          </p>
        </div>
        {isOwner && (
          <form action={deleteList}>
            <input type="hidden" name="id" value={list.id} />
            <button className="btn-danger">Lista törlése</button>
          </form>
        )}
      </div>

      {user && visibleItems.length > 0 && (
        <div className="card p-5">
          <div className="h-3 overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-mute">
            <strong>{done}</strong> / {visibleItems.length} teljesítve ({pct}%)
            {pct === 100 && ' — gratulálunk, a lista teljesítve! 🎉'}
          </p>
        </div>
      )}

      {visibleItems.length === 0 ? (
        <p className="card p-10 text-center text-mute">
          Ez a lista még üres. Böngéssz az <Link href="/otletek" className="text-brand hover:underline">ötletek</Link>{' '}
          között, és add hozzá őket!
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <div key={item.id} className="relative">
              {completedIdeaIds.has(item.ideaId) && (
                <span className="absolute left-3 top-3 z-[1] rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                  ✔ Teljesítve
                </span>
              )}
              <IdeaCard
                idea={{
                  ...item.idea,
                  avg: avgStars(item.idea.reviews),
                  completionCount: item.idea._count.completions,
                }}
              />
              {isOwner && (
                <form action={removeFromList} className="mt-2 text-right">
                  <input type="hidden" name="itemId" value={item.id} />
                  <button className="text-xs text-faint hover:text-red-600 dark:text-red-400">Eltávolítás a listáról</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
