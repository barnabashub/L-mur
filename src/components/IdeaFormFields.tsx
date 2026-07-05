import { CATEGORIES } from '@/lib/constants';

type Defaults = {
  title?: string;
  description?: string;
  category?: string;
  locationName?: string | null;
  isLocationIndependent?: boolean;
  isSeasonal?: boolean;
  seasonLabel?: string | null;
};

/** Közös űrlapmezők ötlet beküldéséhez és moderátori szerkesztéséhez. */
export function IdeaFormFields({ defaults = {} }: { defaults?: Defaults }) {
  return (
    <>
      <div>
        <label className="label" htmlFor="title">Az ötlet neve</label>
        <input className="input" id="title" name="title" required minLength={3} maxLength={120}
          defaultValue={defaults.title ?? ''} placeholder="pl. Naplemente a Halászbástyáról" />
      </div>
      <div>
        <label className="label" htmlFor="description">Leírás</label>
        <textarea className="input" id="description" name="description" rows={5} required minLength={20}
          defaultValue={defaults.description ?? ''}
          placeholder="Mitől különleges? Mire érdemes figyelni? Mennyibe kerül nagyjából?" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">Kategória</label>
          <select className="input" id="category" name="category" required defaultValue={defaults.category ?? ''}>
            <option value="" disabled>Válassz…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="locationName">Helyszín</label>
          <input className="input" id="locationName" name="locationName" maxLength={160}
            defaultValue={defaults.locationName ?? ''} placeholder="pl. Budapest, Halászbástya" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="isLocationIndependent" className="accent-rose-600"
          defaultChecked={defaults.isLocationIndependent ?? false} />
        Helyfüggetlen ötlet (bárhol megvalósítható)
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="isSeasonal" className="accent-rose-600"
            defaultChecked={defaults.isSeasonal ?? false} />
          Időpontfüggő / szezonális
        </label>
        <div>
          <label className="label" htmlFor="seasonLabel">Mikor aktuális?</label>
          <input className="input" id="seasonLabel" name="seasonLabel" maxLength={120}
            defaultValue={defaults.seasonLabel ?? ''} placeholder="pl. május–június, vagy: minden adventi hétvégén" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="image">Fotó (opcionális, max. 5 MB)</label>
        <input className="input" type="file" id="image" name="image" accept="image/*" />
      </div>
    </>
  );
}
