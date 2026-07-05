import { db } from '@/lib/db';
import { saveUpload } from '@/lib/uploads';
import { apiCoupleIds, apiError, apiOk, getApiUser } from '@/lib/api-auth';

/** GET /api/v1/journal — a pár randinaplója (idővonal). Csak a pár tagjainak. */
export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const memberIds = apiCoupleIds(user);
  const [completions, memories] = await Promise.all([
    db.completion.findMany({
      where: { userId: { in: memberIds } },
      include: {
        idea: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    db.memory.findMany({
      where: { userId: { in: memberIds } },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const entries = [
    ...completions.map((c) => ({
      kind: 'completion' as const,
      id: c.id,
      date: c.date,
      title: c.idea.title,
      ideaId: c.idea.id,
      imagePath: c.imagePath,
      publicText: c.publicText,
      privateText: c.privateText,
      byName: c.user.name,
      mine: c.userId === user.id,
    })),
    ...memories.map((m) => ({
      kind: 'memory' as const,
      id: m.id,
      date: m.date,
      title: m.title,
      ideaId: null,
      imagePath: m.imagePath,
      publicText: null,
      privateText: m.text,
      byName: m.user.name,
      mine: m.userId === user.id,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return apiOk(entries);
}

/**
 * POST /api/v1/journal — appon kívüli emlék rögzítése.
 * multipart/form-data: title, date, text, image (opcionális) — vagy JSON kép nélkül.
 */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  let title = '';
  let dateStr = '';
  let text: string | null = null;
  let imagePath: string | null = null;

  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData();
    title = String(fd.get('title') ?? '').trim();
    dateStr = String(fd.get('date') ?? '');
    const t = fd.get('text');
    text = typeof t === 'string' && t.trim() ? t.trim() : null;
    try {
      imagePath = await saveUpload(fd.get('image'));
    } catch (e) {
      return apiError(400, (e as Error).message);
    }
  } else {
    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, 'Érvénytelen kérés.');
    title = typeof body.title === 'string' ? body.title.trim() : '';
    dateStr = typeof body.date === 'string' ? body.date : '';
    text = typeof body.text === 'string' && body.text.trim() ? body.text.trim() : null;
  }

  if (title.length < 2) return apiError(400, 'Adj címet az emléknek.');
  const date = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(date.getTime())) return apiError(400, 'Érvénytelen dátum.');

  const memory = await db.memory.create({ data: { userId: user.id, title, date, text, imagePath } });
  return apiOk({ id: memory.id }, 201);
}
