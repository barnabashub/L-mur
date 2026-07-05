import { db } from '@/lib/db';
import { apiError, apiOk, getApiUser } from '@/lib/api-auth';

/** POST /api/v1/ideas/:id/review — értékelés leadása/frissítése. { stars: 1-5, text? } */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const { id } = await ctx.params;
  const idea = await db.dateIdea.findUnique({ where: { id } });
  if (!idea || idea.status !== 'APPROVED') return apiError(404, 'Az ötlet nem található.');

  const body = await req.json().catch(() => null);
  const stars = Number(body?.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return apiError(400, 'Az értékelés 1 és 5 csillag között lehet.');
  }
  const text = typeof body?.text === 'string' && body.text.trim() ? body.text.trim() : null;

  const review = await db.review.upsert({
    where: { ideaId_userId: { ideaId: id, userId: user.id } },
    create: { ideaId: id, userId: user.id, stars, text },
    update: { stars, text },
  });
  return apiOk({ id: review.id, stars: review.stars });
}
