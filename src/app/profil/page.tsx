import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, partnerOf } from '@/lib/auth';
import { resendVerification } from '@/lib/actions/auth';
import { formatDate } from '@/lib/format';
import { Stars } from '@/components/Stars';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Profilom' };

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'moderációra vár', cls: 'bg-amber-50 text-amber-700' },
  APPROVED: { text: 'elfogadva', cls: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { text: 'visszadobva', cls: 'bg-red-50 text-red-700' },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const partner = partnerOf(user);

  const [ideas, reviews, completionCount, listCount] = await Promise.all([
    db.dateIdea.findMany({ where: { submitterId: user.id }, orderBy: { createdAt: 'desc' } }),
    db.review.findMany({
      where: { userId: user.id },
      include: { idea: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.completion.count({ where: { userId: user.id } }),
    db.bucketList.count({ where: { ownerId: user.id } }),
  ]);

  return (
    <div className="space-y-8">
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />
      <section className="card p-6">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {user.email}{' '}
          {user.emailVerifiedAt ? (
            <span className="badge bg-emerald-50 text-emerald-700">✓ megerősítve</span>
          ) : (
            <span className="badge bg-amber-50 text-amber-700">nincs megerősítve</span>
          )}
          {' '}· csatlakozott: {formatDate(user.createdAt)}
          {user.role !== 'USER' && (
            <span className="badge ml-2 bg-amber-50 text-amber-700">
              {user.role === 'ADMIN' ? 'admin' : 'moderátor'}
            </span>
          )}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          {partner ? (
            <>Párod: <strong>{partner.name}</strong></>
          ) : (
            <Link href="/par" className="text-rose-600 hover:underline">Kapcsold össze a fiókod a pároddal →</Link>
          )}
        </p>
        {!user.emailVerifiedAt && (
          <form action={resendVerification} className="mt-2">
            <button className="btn-secondary text-xs">✉️ Megerősítő e-mail újraküldése</button>
          </form>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-4 text-center">
          {[
            [completionCount, 'kipipált randi'],
            [ideas.length, 'beküldött ötlet'],
            [listCount, 'saját lista'],
          ].map(([n, label]) => (
            <div key={label as string} className="rounded-xl bg-stone-50 py-3">
              <dd className="text-xl font-bold text-rose-600">{n as number}</dd>
              <dt className="text-xs text-stone-500">{label as string}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Beküldött ötleteim</h2>
        {ideas.length === 0 ? (
          <p className="card p-6 text-sm text-stone-500">
            Még nem küldtél be ötletet. <Link href="/otletek/uj" className="text-rose-600 hover:underline">Itt az alkalom! →</Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {ideas.map((idea) => {
              const s = STATUS_LABEL[idea.status] ?? STATUS_LABEL.PENDING;
              return (
                <li key={idea.id} className="card flex flex-wrap items-center gap-3 p-4 text-sm">
                  <div>
                    <Link href={`/otletek/${idea.id}`} className="font-semibold hover:text-rose-700">
                      {idea.title}
                    </Link>
                    <p className="text-xs text-stone-400">beküldve: {formatDate(idea.createdAt)}</p>
                    {idea.status === 'REJECTED' && idea.rejectionNote && (
                      <p className="mt-1 text-xs text-red-600">Indoklás: {idea.rejectionNote}</p>
                    )}
                  </div>
                  <span className={`badge ml-auto ${s.cls}`}>{s.text}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Értékeléseim</h2>
        {reviews.length === 0 ? (
          <p className="card p-6 text-sm text-stone-500">Még nem értékeltél ötletet.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="card flex flex-wrap items-center gap-3 p-4 text-sm">
                <Link href={`/otletek/${r.idea.id}`} className="font-semibold hover:text-rose-700">
                  {r.idea.title}
                </Link>
                <span className="ml-auto"><Stars value={r.stars} /></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
