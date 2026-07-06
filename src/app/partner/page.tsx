import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { redeemCoupon } from '@/lib/actions/coupons';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Partnerfelület' };

export default async function PartnerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string; uzenet?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  if (user.role !== 'PARTNER' || !user.partnerId) redirect('/');

  const partner = await db.partner.findUnique({
    where: { id: user.partnerId },
    include: {
      ideas: { where: { status: 'APPROVED' }, select: { id: true, title: true } },
      redemptions: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!partner) redirect('/');

  const issued = partner.redemptions.length;
  const redeemed = partner.redemptions.filter((r) => r.redeemedAt).length;
  const perIdea = new Map<string, number>();
  for (const r of partner.redemptions) {
    if (r.ideaId && r.redeemedAt) perIdea.set(r.ideaId, (perIdea.get(r.ideaId) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Partnerfelület — {partner.name} 🤝</h1>
        <p className="text-sm text-mute">
          Aktuális ajánlat: {partner.discountText}
        </p>
      </div>
      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          [issued, 'kiadott egyedi kupon'],
          [redeemed, 'beváltott kupon'],
          [issued ? Math.round((redeemed / issued) * 100) + '%' : '–', 'beváltási arány'],
        ].map(([n, label]) => (
          <div key={label as string} className="card p-6 text-center">
            <p className="text-3xl font-bold text-brand">{n as string}</p>
            <p className="mt-1 text-xs text-mute">{label as string}</p>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="mb-1 text-lg font-bold">Kupon beváltása a helyszínen</h2>
        <p className="mb-4 text-sm text-mute">
          Kérd el a vendégtől az egyedi kódját (LEM-…), és írd be ide.
        </p>
        <form action={redeemCoupon} className="flex flex-wrap gap-2">
          <input
            className="input max-w-60 font-mono uppercase tracking-widest"
            name="code"
            required
            placeholder="LEM-XXXX"
          />
          <button className="btn-primary">Beváltás ✔</button>
        </form>
      </section>

      {partner.ideas.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-3 text-lg font-bold">Kapcsolódó randiötletek</h2>
          <ul className="space-y-1 text-sm">
            {partner.ideas.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>{i.title}</span>
                <span className="text-mute">{perIdea.get(i.id) ?? 0} beváltás</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Legutóbbi kuponok</h2>
        {partner.redemptions.length === 0 ? (
          <p className="card p-8 text-center text-sm text-mute">Még nem kértek kupont hozzátok.</p>
        ) : (
          <ul className="space-y-2">
            {partner.redemptions.slice(0, 20).map((r) => (
              <li key={r.id} className="card flex flex-wrap items-center gap-2 p-3 text-sm">
                <span className="font-mono font-bold">{r.code}</span>
                <span className="text-mute">{r.user.name}</span>
                <span className="ml-auto text-xs">
                  {r.redeemedAt ? (
                    <span className="badge-green">
                      beváltva: {formatDateTime(r.redeemedAt)}
                    </span>
                  ) : (
                    <span className="badge-sky">kiadva: {formatDateTime(r.createdAt)}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
