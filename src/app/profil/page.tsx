import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, partnerOf } from '@/lib/auth';
import { resendVerification } from '@/lib/actions/auth';
import { deleteAccount } from '@/lib/actions/account';
import { formatDate, formatDateTime } from '@/lib/format';
import { Stars } from '@/components/Stars';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Profilom' };

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'moderációra vár', cls: 'badge-amber' },
  APPROVED: { text: 'elfogadva', cls: 'badge-green' },
  REJECTED: { text: 'visszadobva', cls: 'badge-red' },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const partner = partnerOf(user);

  const [ideas, reviews, completionCount, listCount, coupons] = await Promise.all([
    db.dateIdea.findMany({ where: { submitterId: user.id }, orderBy: { createdAt: 'desc' } }),
    db.review.findMany({
      where: { userId: user.id },
      include: { idea: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.completion.count({ where: { userId: user.id } }),
    db.bucketList.count({ where: { ownerId: user.id } }),
    db.couponRedemption.findMany({
      where: { userId: user.id },
      include: { partner: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-8">
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />
      <section className="card p-6">
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="mt-1 text-sm text-mute">
          {user.email}{' '}
          {user.emailVerifiedAt ? (
            <span className="badge-green">✓ megerősítve</span>
          ) : (
            <span className="badge-amber">nincs megerősítve</span>
          )}
          {' '}· csatlakozott: {formatDate(user.createdAt)}
          {user.role !== 'USER' && (
            <span className="badge-amber ml-2">
              {user.role === 'ADMIN' ? 'admin' : 'moderátor'}
            </span>
          )}
        </p>
        <p className="mt-1 text-sm text-mute">
          {partner ? (
            <>Párod: <strong>{partner.name}</strong></>
          ) : (
            <Link href="/par" className="text-brand hover:underline">Kapcsold össze a fiókod a pároddal →</Link>
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
            <div key={label as string} className="rounded-xl bg-soft py-3">
              <dd className="text-xl font-bold text-brand">{n as number}</dd>
              <dt className="text-xs text-mute">{label as string}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Beküldött ötleteim</h2>
        {ideas.length === 0 ? (
          <p className="card p-6 text-sm text-mute">
            Még nem küldtél be ötletet. <Link href="/otletek/uj" className="text-brand hover:underline">Itt az alkalom! →</Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {ideas.map((idea) => {
              const s = STATUS_LABEL[idea.status] ?? STATUS_LABEL.PENDING;
              return (
                <li key={idea.id} className="card flex flex-wrap items-center gap-3 p-4 text-sm">
                  <div>
                    <Link href={`/otletek/${idea.id}`} className="font-semibold hover:text-brand">
                      {idea.title}
                    </Link>
                    <p className="text-xs text-faint">beküldve: {formatDate(idea.createdAt)}</p>
                    {idea.status === 'REJECTED' && idea.rejectionNote && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">Indoklás: {idea.rejectionNote}</p>
                    )}
                  </div>
                  <span className={`badge ml-auto ${s.cls}`}>{s.text}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {coupons.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Kuponjaim 🎫</h2>
          <ul className="space-y-2">
            {coupons.map((c) => (
              <li key={c.id} className="card flex flex-wrap items-center gap-2 p-3 text-sm">
                <span className="font-mono font-bold">{c.code}</span>
                <span className="text-mute">{c.partner.name}</span>
                <span className="ml-auto">
                  {c.redeemedAt ? (
                    <span className="badge-soft">beváltva: {formatDateTime(c.redeemedAt)}</span>
                  ) : (
                    <span className="badge-green">aktív — mutasd fel a helyszínen</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Értékeléseim</h2>
        {reviews.length === 0 ? (
          <p className="card p-6 text-sm text-mute">Még nem értékeltél ötletet.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="card flex flex-wrap items-center gap-3 p-4 text-sm">
                <Link href={`/otletek/${r.idea.id}`} className="font-semibold hover:text-brand">
                  {r.idea.title}
                </Link>
                <span className="ml-auto"><Stars value={r.stars} /></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card border-edge p-6">
        <h2 className="mb-1 text-lg font-bold">Adataim és fiókom ⚙️</h2>
        <p className="mb-4 text-sm text-mute">
          A GDPR szerint bármikor letöltheted az összes adatodat, vagy véglegesen törölheted a fiókodat.
        </p>
        <a href="/api/export" className="btn-secondary" download>
          ⬇️ Adataim letöltése (JSON)
        </a>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-red-700">Fiók végleges törlése…</summary>
          <form action={deleteAccount} className="mt-3 max-w-md space-y-3">
            <p className="text-xs text-mute">
              A pipáid, emlékeid, értékeléseid, listáid és dátumaid véglegesen törlődnek. A közösségnek
              elfogadott ötleteid név nélkül megmaradnak. Ez a művelet nem vonható vissza!
            </p>
            <div>
              <label className="label" htmlFor="del-password">Jelszavad</label>
              <input className="input" type="password" id="del-password" name="password" required />
            </div>
            <div>
              <label className="label" htmlFor="del-confirm">Írd be: TÖRLÉS</label>
              <input className="input" id="del-confirm" name="confirm" required placeholder="TÖRLÉS" />
            </div>
            <button className="btn-danger">Fiókom végleges törlése</button>
          </form>
        </details>
      </section>
    </div>
  );
}
