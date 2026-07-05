import { db } from '@/lib/db';
import { avgStars } from '@/lib/ideas';
import { apiCoupleIds, apiError, apiOk, getApiUser } from '@/lib/api-auth';

/** GET /api/v1/lists/:id — lista részletei az elemekkel és a teljesítettséggel. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(req);
  const { id } = await ctx.params;

  const list = await db.bucketList.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: {
          idea: {
            include: { reviews: { select: { stars: true } }, _count: { select: { completions: true } } },
          },
        },
      },
    },
  });
  if (!list || (!list.isSystem && list.ownerId !== user?.id)) {
    return apiError(404, 'A lista nem található.');
  }

  const completedIdeaIds = user
    ? new Set(
        (
          await db.completion.findMany({
            where: { userId: { in: apiCoupleIds(user) } },
            select: { ideaId: true },
          })
        ).map((c) => c.ideaId)
      )
    : new Set<string>();

  const items = list.items
    .filter((i) => i.idea.status === 'APPROVED')
    .map((i) => ({
      itemId: i.id,
      id: i.idea.id,
      title: i.idea.title,
      category: i.idea.category,
      imagePath: i.idea.imagePath,
      locationName: i.idea.locationName,
      isLocationIndependent: i.idea.isLocationIndependent,
      avg: avgStars(i.idea.reviews),
      completionCount: i.idea._count.completions,
      completed: completedIdeaIds.has(i.ideaId),
    }));

  return apiOk({
    id: list.id,
    title: list.title,
    description: list.description,
    isSystem: list.isSystem,
    isOwner: !list.isSystem && list.ownerId === user?.id,
    items,
  });
}

/** DELETE /api/v1/lists/:id — saját lista törlése. */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const { id } = await ctx.params;
  const list = await db.bucketList.findUnique({ where: { id } });
  if (!list || list.isSystem || list.ownerId !== user.id) {
    return apiError(404, 'Ez a lista nem törölhető.');
  }
  await db.bucketList.delete({ where: { id } });
  return apiOk({ deleted: true });
}
