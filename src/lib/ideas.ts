import 'server-only';
import { db } from './db';
import { parseTags } from './discover';

/** Átlagértékelés — null, ha nincs értékelés. */
export function avgStars(reviews: { stars: number }[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
}

export type IdeaFilter = {
  q?: string;
  category?: string;
  hely?: 'helyfuggetlen' | 'helyhez-kotott';
  rendezes?: 'ertekeles' | 'nepszeru' | 'legujabb';
  cimke?: string;
  akadalymentes?: string;
};

/** Jóváhagyott ötletek szűrve, statisztikákkal, rendezve. */
export async function fetchApprovedIdeas(filter: IdeaFilter) {
  const ideas = await db.dateIdea.findMany({
    where: {
      status: 'APPROVED',
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.hely === 'helyfuggetlen' ? { isLocationIndependent: true } : {}),
      ...(filter.hely === 'helyhez-kotott' ? { isLocationIndependent: false } : {}),
      ...(filter.q
        ? {
            OR: [
              { title: { contains: filter.q } },
              { description: { contains: filter.q } },
              { locationName: { contains: filter.q } },
            ],
          }
        : {}),
    },
    include: {
      reviews: { select: { stars: true } },
      partner: { select: { id: true, name: true } },
      _count: { select: { completions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  let withStats = ideas.map((idea) => ({
    ...idea,
    avg: avgStars(idea.reviews),
    completionCount: idea._count.completions,
  }));

  if (filter.cimke) {
    const wanted = filter.cimke.toLowerCase();
    withStats = withStats.filter((i) => parseTags(i.tags).includes(wanted));
  }
  if (filter.akadalymentes) {
    const wanted = filter.akadalymentes;
    withStats = withStats.filter((i) => parseTags(i.accessibility).includes(wanted));
  }

  if (filter.rendezes === 'ertekeles') {
    withStats.sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0) || b.reviews.length - a.reviews.length);
  } else if (filter.rendezes === 'nepszeru') {
    withStats.sort((a, b) => b.completionCount - a.completionCount);
  }
  return withStats;
}
