import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { fetchApprovedIdeas, type IdeaFilter } from '@/lib/ideas';
import { IdeaCard } from '@/components/IdeaCard';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Randiötletek' };

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    kategoria?: string;
    hely?: string;
    rendezes?: string;
    cimke?: string;
    hiba?: string;
    uzenet?: string;
  }>;
}) {
  const sp = await searchParams;
  const filter: IdeaFilter = {
    q: sp.q,
    cimke: sp.cimke,
    category: sp.kategoria,
    hely: sp.hely === 'helyfuggetlen' || sp.hely === 'helyhez-kotott' ? sp.hely : undefined,
    rendezes:
      sp.rendezes === 'ertekeles' || sp.rendezes === 'nepszeru' ? sp.rendezes : 'legujabb',
  };
  const ideas = await fetchApprovedIdeas(filter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Randiötletek</h1>
          <p className="text-sm text-mute">{ideas.length} ötlet a szűrők szerint</p>
        </div>
        <Link href="/otletek/uj" className="btn-primary">+ Új ötletet küldök be</Link>
      </div>

      <Flash hiba={sp.hiba} uzenet={sp.uzenet} />

      {sp.cimke && (
        <p className="mb-4 text-sm text-mute">
          Szűrés címkére: <span className="badge-soft">#{sp.cimke}</span>{' '}
          <Link href="/otletek" className="text-brand hover:underline">× szűrő törlése</Link>
        </p>
      )}

      <form className="card mb-8 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto_auto]" method="get">
        <input
          className="input"
          type="search"
          name="q"
          placeholder="Keresés címre, leírásra, helyre…"
          defaultValue={sp.q ?? ''}
        />
        <select className="input sm:w-44" name="kategoria" defaultValue={sp.kategoria ?? ''}>
          <option value="">Minden kategória</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input sm:w-44" name="hely" defaultValue={sp.hely ?? ''}>
          <option value="">Bármilyen helyszín</option>
          <option value="helyhez-kotott">Helyhez kötött</option>
          <option value="helyfuggetlen">Helyfüggetlen</option>
        </select>
        <select className="input sm:w-44" name="rendezes" defaultValue={sp.rendezes ?? 'legujabb'}>
          <option value="legujabb">Legújabb elöl</option>
          <option value="ertekeles">Legjobbra értékelt</option>
          <option value="nepszeru">Legtöbbet teljesített</option>
        </select>
        <button className="btn-secondary">Szűrés</button>
      </form>

      {ideas.length === 0 ? (
        <p className="card p-10 text-center text-mute">
          Nincs a szűrőknek megfelelő ötlet.{' '}
          <Link href="/otletek" className="text-brand hover:underline">Szűrők törlése</Link>
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
