import { db } from '@/lib/db';
import { apiError, apiOk, getApiUser } from '@/lib/api-auth';

/** POST /api/v1/lists/:id/items — ötlet hozzáadása saját listához. { ideaId } */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const ideaId = typeof body?.ideaId === 'string' ? body.ideaId : '';

  const list = await db.bucketList.findUnique({ where: { id }, include: { items: true } });
  if (!list || list.isSystem || list.ownerId !== user.id) return apiError(404, 'A lista nem található.');
  const idea = await db.dateIdea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== 'APPROVED') return apiError(404, 'Az ötlet nem található.');
  if (list.items.some((i) => i.ideaId === ideaId)) {
    return apiError(409, 'Ez az ötlet már rajta van a listán.');
  }

  const item = await db.bucketListItem.create({
    data: { listId: id, ideaId, order: list.items.length },
  });
  return apiOk({ itemId: item.id }, 201);
}

/** DELETE /api/v1/lists/:id/items?itemId= — elem eltávolítása saját listáról. */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const { id } = await ctx.params;
  const itemId = new URL(req.url).searchParams.get('itemId') ?? '';
  const item = await db.bucketListItem.findUnique({ where: { id: itemId }, include: { list: true } });
  if (!item || item.listId !== id || item.list.isSystem || item.list.ownerId !== user.id) {
    return apiError(404, 'Az elem nem található.');
  }
  await db.bucketListItem.delete({ where: { id: itemId } });
  return apiOk({ deleted: true });
}
