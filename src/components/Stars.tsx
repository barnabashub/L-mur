/** Csillagos értékelés megjelenítése (fél csillag kerekítéssel). */
export function Stars({ value, count }: { value: number | null; count?: number }) {
  if (value === null) {
    return <span className="text-xs text-stone-400">Még nincs értékelés</span>;
  }
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-500" aria-label={`${value.toFixed(1)} csillag`}>
        {'★'.repeat(rounded)}
        <span className="text-stone-300">{'★'.repeat(5 - rounded)}</span>
      </span>
      <span className="font-medium text-stone-700">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-stone-400">({count})</span>}
    </span>
  );
}

/** Csillagválasztó űrlapokhoz — rádiógombok, JS nélkül. */
export function StarInput({ name = 'stars', defaultValue }: { name?: string; defaultValue?: number }) {
  return (
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="flex cursor-pointer flex-col items-center text-xs text-stone-500">
          <span className="text-lg text-amber-500">{'★'.repeat(n)}</span>
          <input
            type="radio"
            name={name}
            value={n}
            defaultChecked={defaultValue === n}
            required
            className="mt-1 accent-rose-600"
          />
        </label>
      ))}
    </div>
  );
}
