import Link from 'next/link';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createPartner } from '@/lib/actions/moderation';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Partnereink' };

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const partners = await db.partner.findMany({
    include: { ideas: { where: { status: 'APPROVED' }, select: { id: true, title: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Partnereink 🤝</h1>
        <p className="mt-1 max-w-2xl text-sm text-mute">
          Olyan helyekkel és szervezetekkel dolgozunk együtt, akik hisznek abban, hogy a
          párkapcsolatokba érdemes időt fektetni. A Kettesben-felhasználók a partnereinknél
          kedvezményt kapnak a randijukhoz — a kuponkódot bejelentkezés után az ötlet oldalán
          találjátok.
        </p>
      </div>
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      <div className="grid gap-5 sm:grid-cols-2">
        {partners.map((p) => (
          <section key={p.id} className="card p-6">
            <h2 className="font-bold text-ink">{p.name}</h2>
            {p.description && <p className="mt-1 text-sm text-mute">{p.description}</p>}
            <p className="mt-3 text-sm font-medium text-amber-800 dark:text-amber-200">🎟️ {p.discountText}</p>
            {user && (
              <p className="mt-2 inline-block rounded-lg border border-dashed border-amber-400 bg-amber-100 dark:bg-amber-400/15 px-3 py-1 font-mono font-bold tracking-widest text-amber-800 dark:text-amber-200">
                {p.couponCode}
              </p>
            )}
            {p.website && (
              <p className="mt-2 text-sm">
                <a href={p.website} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                  {p.website}
                </a>
              </p>
            )}
            {p.ideas.length > 0 && (
              <div className="mt-3 border-t border-edge pt-3 text-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">
                  Kapcsolódó randiötletek
                </p>
                <ul className="space-y-1">
                  {p.ideas.map((i) => (
                    <li key={i.id}>
                      <Link href={`/otletek/${i.id}`} className="text-brand hover:underline">
                        {i.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>

      {!user && (
        <p className="card p-6 text-sm text-mute">
          A kuponkódokhoz <Link href="/belepes" className="font-medium text-brand hover:underline">lépj be</Link>{' '}
          vagy <Link href="/regisztracio" className="font-medium text-brand hover:underline">regisztrálj</Link>.
        </p>
      )}

      {user?.role === 'ADMIN' && (
        <details className="card p-6">
          <summary className="cursor-pointer font-semibold">⚙️ Új partner rögzítése (admin)</summary>
          <form action={createPartner} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" name="name" required placeholder="Partner neve" />
              <input className="input" name="website" type="url" placeholder="https://…" />
            </div>
            <input className="input" name="description" placeholder="Rövid bemutatás" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" name="discountText" required placeholder="Kedvezmény (pl. 20% a belépőből)" />
              <input className="input" name="couponCode" required placeholder="Kuponkód (pl. KETTESBEN20)" />
            </div>
            <button className="btn-primary">Partner mentése</button>
          </form>
        </details>
      )}
    </div>
  );
}
