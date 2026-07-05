import { db } from '@/lib/db';
import { apiError, apiOk, getApiUser } from '@/lib/api-auth';

/** GET /api/v1/notifications — a felhasználó értesítései. */
export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return apiOk(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      read: !!n.readAt,
      createdAt: n.createdAt,
    }))
  );
}

/** POST /api/v1/notifications — minden értesítés olvasottnak jelölése. */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return apiOk({ ok: true });
}
