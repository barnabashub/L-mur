import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canViewIdea, canViewPrivate, isModerator } from '@/lib/permissions';
import { avgStars } from '@/lib/ideas';
import { formatDate } from '@/lib/format';
import { toInputDate } from '@/lib/format';
import { completeIdea, requestModeration, reviewIdea } from '@/lib/actions/ideas';
import { addToList } from '@/lib/actions/lists';
import { requestCoupon } from '@/lib/actions/coupons';
import { parseTags } from '@/lib/discover';
import { IdeaImage } from '@/components/IdeaImage';
import { Stars, StarInput } from '@/components/Stars';
import { Flash } from '@/components/Flash';

export default async function IdeaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();

  const idea = await db.dateIdea.findUnique({
    where: { id },
    include: {
      submitter: { select: { id: true, name: true } },
      partner: true,
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      completions: {
        include: { user: { select: { id: true, name: true, coupleId: true } } },
        orderBy: { date: 'desc' },
      },
    },
  });
  if (!idea || !canViewIdea(idea.status, idea.submitterId, user)) notFound();

  const avg = avgStars(idea.reviews);
  const viewer = user ? { userId: user.id, userCoupleId: user.coupleId } : null;
  const ownCompletions = user ? idea.completions.filter((c) => c.userId === user.id) : [];
  const publicCompletions = idea.completions.filter(
    (c) => (c.imagePublic && c.imagePath) || c.publicText
  );
  const myReview = user ? idea.reviews.find((r) => r.userId === user.id) : undefined;
  const myLists = user
    ? await db.bucketList.findMany({
        where: { ownerId: user.id },
        include: { items: { select: { ideaId: true } } },
        orderBy: { createdAt: 'asc' },
      })
    : [];
  const listsWithout = myLists.filter((l) => !l.items.some((i) => i.ideaId === idea.id));

  return (
    <div className="space-y-10">
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      {idea.status !== 'APPROVED' && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {idea.status === 'PENDING'
            ? 'Ez a javaslat moderációra vár, még nem nyilvános.'
            : `Ezt a javaslatot a moderátorok visszadobták. ${idea.rejectionNote ? `Indoklás: ${idea.rejectionNote}` : ''}`}
        </p>
      )}

      <section className="card overflow-hidden">
        <IdeaImage imagePath={idea.imagePath} category={idea.category} title={idea.title} className="h-64 w-full sm:h-80" />
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-rose-50 text-rose-700">{idea.category}</span>
            <span className="badge bg-stone-100 text-stone-700">
              {idea.isLocationIndependent ? '🌍 Helyfüggetlen' : `📍 ${idea.locationName}`}
            </span>
            {idea.isSeasonal && idea.seasonLabel && (
              <span className="badge bg-sky-50 text-sky-700">📅 {idea.seasonLabel}</span>
            )}
            {parseTags(idea.tags).map((tag) => (
              <Link key={tag} href={`/otletek?cimke=${encodeURIComponent(tag)}`} className="badge bg-stone-100 text-stone-600 hover:bg-stone-200">
                #{tag}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">{idea.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                <Stars value={avg} count={idea.reviews.length} />
                <span>✔ {idea.completions.length} teljesítés</span>
              </p>
            </div>
            {user && isModerator(user.role) && (
              <Link href={`/moderacio/otlet/${idea.id}`} className="btn-secondary">✏️ Szerkesztés</Link>
            )}
          </div>
          <p className="whitespace-pre-line leading-relaxed text-stone-700">{idea.description}</p>
          <p className="border-t border-stone-100 pt-4 text-xs text-stone-400">
            Feltöltötte: <span className="font-medium text-stone-500">{idea.submitter.name}</span>
            {' · '}Feltöltve: {formatDate(idea.createdAt)}
            {' · '}Utoljára frissítve: {formatDate(idea.updatedAt)}
          </p>
        </div>
      </section>

      {idea.partner && (
        <section className="card border-amber-200 bg-amber-50/60 p-6">
          <h2 className="font-bold text-amber-900">🎟️ Kedvezmény a Kettesben-pároknak</h2>
          <p className="mt-1 text-sm text-amber-900">
            <strong>{idea.partner.name}</strong>: {idea.partner.discountText}
          </p>
          {user ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="inline-block rounded-lg border border-dashed border-amber-400 bg-white px-4 py-2 font-mono text-lg font-bold tracking-widest text-amber-800">
                {idea.partner.couponCode}
              </p>
              <form action={requestCoupon}>
                <input type="hidden" name="ideaId" value={idea.id} />
                <button className="btn-secondary">🎫 Egyedi, követett kupont kérek</button>
              </form>
            </div>
          ) : (
            <p className="mt-3 text-sm text-amber-800">
              A kuponkódhoz <Link href="/belepes" className="font-semibold underline">lépj be</Link> vagy{' '}
              <Link href="/regisztracio" className="font-semibold underline">regisztrálj</Link>.
            </p>
          )}
          <p className="mt-2 text-xs text-amber-700">Mutasd fel a kódot a helyszínen. Részletek: <Link href="/partnerek" className="underline">partnereink</Link>.</p>
        </section>
      )}

      {user && idea.status === 'APPROVED' && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold">Kipipálom ✔</h2>
            <p className="mb-4 text-sm text-stone-500">
              Teljesítettétek ezt a randit? Örökítsétek meg — a privát részeket csak ti ketten látjátok.
            </p>
            <form action={completeIdea} className="space-y-3">
              <input type="hidden" name="ideaId" value={idea.id} />
              <div>
                <label className="label" htmlFor="date">Mikor voltatok?</label>
                <input className="input" type="date" id="date" name="date" defaultValue={toInputDate(new Date())} required />
              </div>
              <div>
                <label className="label" htmlFor="image">Fotó (opcionális)</label>
                <input className="input" type="file" id="image" name="image" accept="image/*" />
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" name="imagePublic" className="accent-rose-600" />
                A fotó lehet publikus (megjelenhet az ötlet oldalán)
              </label>
              <div>
                <label className="label" htmlFor="publicText">Publikus élménybeszámoló (opcionális)</label>
                <textarea className="input" id="publicText" name="publicText" rows={2}
                  placeholder="Amit szívesen megosztotok másokkal is…" />
              </div>
              <div>
                <label className="label" htmlFor="privateText">Privát emlék — csak nektek 🔒</label>
                <textarea className="input" id="privateText" name="privateText" rows={3}
                  placeholder="Ami csak kettőtökre tartozik…" />
              </div>
              <button className="btn-primary w-full">Kipipálom, megvolt! 🎉</button>
            </form>
          </div>

          <div className="space-y-6">
            {ownCompletions.length > 0 && (
              <div className="card p-6">
                <h2 className="mb-3 text-lg font-bold">A ti korábbi teljesítéseitek</h2>
                <ul className="space-y-3">
                  {ownCompletions.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 text-sm">
                      {c.imagePath && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.imagePath} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-medium">{formatDate(c.date)}</p>
                        {(c.publicText || c.privateText) && (
                          <p className="line-clamp-1 text-stone-500">{c.publicText ?? c.privateText}</p>
                        )}
                      </div>
                      <Link href="/naplo" className="ml-auto text-xs font-medium text-rose-600 hover:underline">
                        Napló →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card p-6">
              <h2 className="mb-3 text-lg font-bold">Bakancslistára teszem</h2>
              {myLists.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Még nincs saját listád —{' '}
                  <Link href="/bakancslistak" className="font-medium text-rose-600 hover:underline">
                    hozz létre egyet
                  </Link>
                  .
                </p>
              ) : listsWithout.length === 0 ? (
                <p className="text-sm text-stone-500">Ez az ötlet már minden listádon rajta van. 💪</p>
              ) : (
                <form action={addToList} className="flex gap-2">
                  <input type="hidden" name="ideaId" value={idea.id} />
                  <select className="input" name="listId" required defaultValue="">
                    <option value="" disabled>Válassz listát…</option>
                    {listsWithout.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                  <button className="btn-secondary shrink-0">Hozzáadás</button>
                </form>
              )}
            </div>

            <details className="card p-6">
              <summary className="cursor-pointer font-semibold text-stone-700">
                🚩 Moderáció / javítás kérése
              </summary>
              <form action={requestModeration} className="mt-4 space-y-3">
                <input type="hidden" name="ideaId" value={idea.id} />
                <textarea className="input" name="message" rows={3} required minLength={5}
                  placeholder="Mi a gond az ötlettel? (elavult ár, bezárt hely, pontatlan leírás…)" />
                <button className="btn-secondary">Jelzés küldése a moderátoroknak</button>
              </form>
            </details>
          </div>
        </section>
      )}

      {publicCompletions.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Párok, akik már teljesítették 📸</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicCompletions.map((c) => {
              const showPrivate = canViewPrivate(viewer, {
                userId: c.userId,
                userCoupleId: c.user.coupleId,
              });
              return (
                <figure key={c.id} className="card overflow-hidden">
                  {c.imagePublic && c.imagePath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imagePath} alt="" className="h-40 w-full object-cover" />
                  )}
                  <figcaption className="space-y-1 p-4 text-sm">
                    {c.publicText && <p className="text-stone-700">„{c.publicText}"</p>}
                    {showPrivate && c.privateText && (
                      <p className="text-stone-500">🔒 {c.privateText}</p>
                    )}
                    <p className="text-xs text-stone-400">
                      {c.user.name} · {formatDate(c.date)}
                    </p>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">Értékelések ⭐</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {idea.reviews.length === 0 ? (
              <p className="card p-6 text-sm text-stone-500">Még senki sem értékelte — legyetek ti az elsők!</p>
            ) : (
              idea.reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <Stars value={r.stars} />
                    <span className="text-xs text-stone-400">{r.user.name} · {formatDate(r.createdAt)}</span>
                  </div>
                  {r.text && <p className="mt-2 text-sm text-stone-700">{r.text}</p>}
                </div>
              ))
            )}
          </div>
          {user && idea.status === 'APPROVED' && (
            <form action={reviewIdea} className="card h-fit space-y-3 p-6">
              <h3 className="font-semibold">{myReview ? 'Értékelésed frissítése' : 'Ti hogy éreztétek magatokat?'}</h3>
              <input type="hidden" name="ideaId" value={idea.id} />
              <StarInput defaultValue={myReview?.stars} />
              <textarea className="input" name="text" rows={3} defaultValue={myReview?.text ?? ''}
                placeholder="Pár mondat a tapasztalatokról (opcionális)…" />
              <button className="btn-primary">{myReview ? 'Frissítés' : 'Értékelés küldése'}</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
