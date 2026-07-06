import { db } from '@/lib/db';
import { avgStars } from '@/lib/ideas';
import { canViewPrivate } from '@/lib/permissions';
import { parseTags } from '@/lib/discover';
import { apiError, apiOk, getApiUser } from '@/lib/api-auth';

/** GET /api/v1/ideas/:id — ötlet részletei (a láthatósági szabályok szerint). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getApiUser(req);

  const idea = await db.dateIdea.findUnique({
    where: { id },
    include: {
      submitter: { select: { name: true } },
      partner: true,
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      completions: {
        include: { user: { select: { id: true, name: true, coupleId: true } } },
        orderBy: { date: 'desc' },
      },
    },
  });
  if (!idea || idea.status !== 'APPROVED') return apiError(404, 'Az ötlet nem található.');

  const viewer = user ? { userId: user.id, userCoupleId: user.coupleId } : null;

  return apiOk({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    imagePath: idea.imagePath,
    locationName: idea.locationName,
    isLocationIndependent: idea.isLocationIndependent,
    isSeasonal: idea.isSeasonal,
    seasonLabel: idea.seasonLabel,
    accessibility: parseTags(idea.accessibility),
    submitterName: idea.submitter.name,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    avg: avgStars(idea.reviews),
    completionCount: idea.completions.length,
    partner: idea.partner
      ? {
          name: idea.partner.name,
          discountText: idea.partner.discountText,
          // Kuponkód csak bejelentkezve.
          couponCode: user ? idea.partner.couponCode : null,
        }
      : null,
    reviews: idea.reviews.map((r) => ({
      id: r.id,
      stars: r.stars,
      text: r.text,
      userName: r.user.name,
      mine: user ? r.userId === user.id : false,
      createdAt: r.createdAt,
    })),
    myCompletions: user
      ? idea.completions
          .filter((c) => c.userId === user.id)
          .map((c) => ({ id: c.id, date: c.date, imagePath: c.imagePath, publicText: c.publicText, privateText: c.privateText }))
      : [],
    publicCompletions: idea.completions
      .filter((c) => (c.imagePublic && c.imagePath) || c.publicText)
      .map((c) => ({
        id: c.id,
        date: c.date,
        userName: c.user.name,
        imagePath: c.imagePublic ? c.imagePath : null,
        publicText: c.publicText,
        privateText: canViewPrivate(viewer, { userId: c.userId, userCoupleId: c.user.coupleId })
          ? c.privateText
          : null,
      })),
  });
}
