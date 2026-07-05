import { db } from '@/lib/db';
import { apiCoupleIds, apiError, apiOk, getApiUser } from '@/lib/api-auth';

/** GET /api/v1/lists — gyári + saját listák, a pár közös haladásával. */
export async function GET(req: Request) {
  const user = await getApiUser(req);

  const lists = await db.bucketList.findMany({
    where: { OR: [{ isSystem: true }, ...(user ? [{ ownerId: user.id }] : [])] },
    include: { items: { select: { ideaId: true } } },
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
  });

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

  return apiOk(
    lists.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      isSystem: l.isSystem,
      total: l.items.length,
      done: l.items.filter((i) => completedIdeaIds.has(i.ideaId)).length,
    }))
  );
}

/** POST /api/v1/lists — saját lista létrehozása. { title, description? } */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (title.length < 3) return apiError(400, 'A lista neve legalább 3 karakter legyen.');

  const list = await db.bucketList.create({
    data: {
      title,
      description: typeof body?.description === 'string' && body.description.trim() ? body.description.trim() : null,
      ownerId: user.id,
    },
  });
  return apiOk({ id: list.id }, 201);
}
