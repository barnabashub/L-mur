import { ACCESSIBILITY_OPTIONS, CATEGORIES } from '@/lib/constants';
import { LocationPicker } from './LocationPicker';

type Defaults = {
  title?: string;
  accessibility?: string | null;
  description?: string;
  category?: string;
  locationName?: string | null;
  isLocationIndependent?: boolean;
  isSeasonal?: boolean;
  seasonLabel?: string | null;
  lat?: number | null;
  lng?: number | null;
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
      <div>
        <label className="label" htmlFor="category">Kategória</label>
        <select className="input sm:max-w-xs" id="category" name="category" required defaultValue={defaults.category ?? ''}>
          <option value="" disabled>Válassz…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <LocationPicker
        defaultLocationName={defaults.locationName}
        defaultLat={defaults.lat}
        defaultLng={defaults.lng}
        defaultLocationIndependent={defaults.isLocationIndependent}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-ink/90">
          <input type="checkbox" name="isSeasonal" className="accent-violet-500"
            defaultChecked={defaults.isSeasonal ?? false} />
          Időpontfüggő / szezonális
        </label>
        <div>
          <label className="label" htmlFor="seasonLabel">Mikor aktuális?</label>
          <input className="input" id="seasonLabel" name="seasonLabel" maxLength={120}
            defaultValue={defaults.seasonLabel ?? ''} placeholder="pl. május–június, vagy: minden adventi hétvégén" />
        </div>
      </div>
      <fieldset>
        <legend className="label">Akadálymentesség — kinek ajánlható nyugodt szívvel?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACCESSIBILITY_OPTIONS.map((o) => (
            <label key={o.key} className="flex items-center gap-2 text-sm text-ink/90">
              <input
                type="checkbox"
                name="accessibility"
                value={o.key}
                className="accent-violet-500"
                defaultChecked={(defaults.accessibility ?? '').split(',').map((k) => k.trim()).includes(o.key)}
              />
              {o.emoji} {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="image">Fotó (opcionális, max. 5 MB)</label>
        <input className="input" type="file" id="image" name="image" accept="image/*" />
      </div>
    </>
  );
}
