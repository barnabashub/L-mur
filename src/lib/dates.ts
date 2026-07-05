/**
 * Évforduló- és hónapforduló-számítás — tiszta függvények, egységtesztelve.
 */

export type Anniversary = {
  /** A forduló napja */
  date: Date;
  /** 'yearly' | 'monthly' */
  kind: 'yearly' | 'monthly';
  /** Hányadik forduló (év vagy hónap) */
  count: number;
  /** Hány nap múlva (0 = ma) */
  daysAway: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/**
 * Adott naphoz igazított dátum: ha a cél hónapban nincs olyan nap
 * (pl. jan. 31. -> február), a hónap utolsó napjára esik.
 */
function onDay(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

/** A következő évforduló az `origin` dátumhoz képest, `today`-tól nézve (ma is számít). */
export function nextYearlyAnniversary(origin: Date, today: Date): Anniversary {
  const t = startOfDay(today);
  let year = t.getFullYear();
  let candidate = onDay(year, origin.getMonth(), origin.getDate());
  if (candidate < t) candidate = onDay(year + 1, origin.getMonth(), origin.getDate());
  return {
    date: candidate,
    kind: 'yearly',
    count: candidate.getFullYear() - origin.getFullYear(),
    daysAway: daysBetween(t, candidate),
  };
}

/** A következő hónapforduló az `origin` dátumhoz képest, `today`-tól nézve. */
export function nextMonthlyAnniversary(origin: Date, today: Date): Anniversary {
  const t = startOfDay(today);
  let candidate = onDay(t.getFullYear(), t.getMonth(), origin.getDate());
  if (candidate < t) {
    candidate = onDay(t.getFullYear(), t.getMonth() + 1, origin.getDate());
  }
  const count =
    (candidate.getFullYear() - origin.getFullYear()) * 12 +
    (candidate.getMonth() - origin.getMonth());
  return { date: candidate, kind: 'monthly', count, daysAway: daysBetween(t, candidate) };
}

export type ImportantDateLike = {
  id: string;
  title: string;
  date: Date;
  notifyYearly: boolean;
  notifyMonthly: boolean;
};

/** A bekapcsolt emlékeztetők közelgő fordulói, idő szerint rendezve. */
export function upcomingAnniversaries(
  dates: ImportantDateLike[],
  today: Date,
  withinDays = 45
): Array<Anniversary & { id: string; title: string }> {
  const out: Array<Anniversary & { id: string; title: string }> = [];
  for (const d of dates) {
    if (d.notifyYearly) {
      const a = nextYearlyAnniversary(d.date, today);
      if (a.daysAway <= withinDays && a.count > 0) out.push({ ...a, id: d.id, title: d.title });
    }
    if (d.notifyMonthly) {
      const a = nextMonthlyAnniversary(d.date, today);
      if (a.daysAway <= withinDays && a.count > 0) out.push({ ...a, id: d.id, title: d.title });
    }
  }
  return out.sort((a, b) => a.daysAway - b.daysAway);
}
