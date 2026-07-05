import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireModerator } from '@/lib/auth';
import { editIdea } from '@/lib/actions/moderation';
import { IdeaFormFields } from '@/components/IdeaFormFields';
import { IdeaImage } from '@/components/IdeaImage';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Ötlet szerkesztése' };

export default async function EditIdeaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hiba?: string }>;
}) {
  await requireModerator();
  const { id } = await params;
  const sp = await searchParams;

  const [idea, partners] = await Promise.all([
    db.dateIdea.findUnique({ where: { id } }),
    db.partner.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!idea) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ötlet szerkesztése (moderátor)</h1>
      <Flash hiba={sp.hiba} />
      <IdeaImage imagePath={idea.imagePath} category={idea.category} title={idea.title} className="h-48 w-full rounded-2xl" />
      <form action={editIdea} className="card space-y-4 p-6">
        <input type="hidden" name="id" value={idea.id} />
        <IdeaFormFields defaults={idea} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tags">Címkék (vesszővel)</label>
            <input className="input" id="tags" name="tags" defaultValue={idea.tags ?? ''}
              placeholder="pl. ingyenes, kutyabarát" />
          </div>
          <div>
            <label className="label" htmlFor="seasonMonths">Aktuális hónapok (pl. 5,6,7)</label>
            <input className="input" id="seasonMonths" name="seasonMonths" defaultValue={idea.seasonMonths ?? ''}
              pattern="^\s*\d{1,2}(\s*,\s*\d{1,2})*\s*$" placeholder="üres = egész évben" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="lat">Szélesség (lat) — térképhez</label>
            <input className="input" id="lat" name="lat" type="number" step="any" min="-90" max="90"
              defaultValue={idea.lat ?? ''} placeholder="pl. 47.5022" />
          </div>
          <div>
            <label className="label" htmlFor="lng">Hosszúság (lng)</label>
            <input className="input" id="lng" name="lng" type="number" step="any" min="-180" max="180"
              defaultValue={idea.lng ?? ''} placeholder="pl. 19.0344" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="partnerId">Kedvezménypartner</label>
          <select className="input" id="partnerId" name="partnerId" defaultValue={idea.partnerId ?? ''}>
            <option value="">Nincs partner</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.discountText}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary w-full">Módosítások mentése</button>
      </form>
    </div>
  );
}
