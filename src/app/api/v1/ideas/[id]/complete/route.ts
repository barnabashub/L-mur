import { db } from '@/lib/db';
import { saveUpload } from '@/lib/uploads';
import { apiError, apiOk, getApiUser } from '@/lib/api-auth';

/**
 * POST /api/v1/ideas/:id/complete — randi kipipálása.
 * multipart/form-data: date, imagePublic, publicText, privateText, image (opcionális fájl)
 * vagy application/json ugyanezekkel a mezőkkel (kép nélkül).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const { id } = await ctx.params;
  const idea = await db.dateIdea.findUnique({ where: { id } });
  if (!idea || idea.status !== 'APPROVED') return apiError(404, 'Az ötlet nem található.');

  let fields: Record<string, unknown> = {};
  let imagePath: string | null = null;

  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData();
    fields = {
      date: fd.get('date'),
      imagePublic: fd.get('imagePublic') === 'true' || fd.get('imagePublic') === 'on',
      publicText: fd.get('publicText'),
      privateText: fd.get('privateText'),
    };
    try {
      imagePath = await saveUpload(fd.get('image'));
    } catch (e) {
      return apiError(400, (e as Error).message);
    }
  } else {
    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, 'Érvénytelen kérés.');
    fields = body;
  }

  const date = fields.date ? new Date(String(fields.date)) : new Date();
  if (isNaN(date.getTime())) return apiError(400, 'Érvénytelen dátum.');

  const completion = await db.completion.create({
    data: {
      ideaId: id,
      userId: user.id,
      date,
      imagePath,
      imagePublic: fields.imagePublic === true,
      publicText: typeof fields.publicText === 'string' && fields.publicText.trim() ? fields.publicText.trim() : null,
      privateText: typeof fields.privateText === 'string' && fields.privateText.trim() ? fields.privateText.trim() : null,
    },
  });
  return apiOk({ id: completion.id }, 201);
}
