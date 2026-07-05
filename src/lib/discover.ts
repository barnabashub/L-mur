/**
 * Felfedezés-logika: napi ajánló, szezonalitás, címkék — tiszta függvények.
 */

/** Determinisztikus "ötlet a mai napra": adott napon mindenkinek ugyanaz. */
export function pickOfTheDay<T>(items: T[], date: Date): T | null {
  if (items.length === 0) return null;
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return items[hash % items.length];
}

/** "5,6,7" → [5, 6, 7]; érvénytelen elemek kiszűrve. */
export function parseMonths(seasonMonths: string | null | undefined): number[] {
  if (!seasonMonths) return [];
  return seasonMonths
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
}

/** Aktuális-e az ötlet az adott hónapban? (Hónapmegadás nélkül mindig az.) */
export function isInSeason(seasonMonths: string | null | undefined, date: Date): boolean {
  const months = parseMonths(seasonMonths);
  if (months.length === 0) return true;
  return months.includes(date.getMonth() + 1);
}

/** "ingyenes, Kutyabarát ,," → ["ingyenes", "kutyabarát"] (normalizálva, dedupe). */
export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return [...new Set(tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))];
}

/** Címkelista normalizált tárolási alakja. */
export function normalizeTags(input: string): string | null {
  const tags = parseTags(input);
  return tags.length ? tags.join(', ') : null;
}
