import { db } from '@/lib/db';
import { upcomingAnniversaries } from '@/lib/dates';
import { apiCoupleIds, apiError, apiOk, getApiUser } from '@/lib/api-auth';

/** GET /api/v1/dates — fontos dátumok + közelgő fordulók. */
export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const dates = await db.importantDate.findMany({
    where: { userId: { in: apiCoupleIds(user) } },
    orderBy: { date: 'asc' },
  });
  return apiOk({
    dates: dates.map((d) => ({
      id: d.id,
      title: d.title,
      date: d.date,
      notifyYearly: d.notifyYearly,
      notifyMonthly: d.notifyMonthly,
    })),
    upcoming: upcomingAnniversaries(dates, new Date(), 45),
  });
}

/** POST /api/v1/dates — új fontos dátum. { title, date, notifyYearly?, notifyMonthly? } */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const date = new Date(String(body?.date ?? ''));
  if (title.length < 2) return apiError(400, 'Adj nevet a dátumnak.');
  if (isNaN(date.getTime())) return apiError(400, 'Érvénytelen dátum.');

  const created = await db.importantDate.create({
    data: {
      userId: user.id,
      title,
      date,
      notifyYearly: body?.notifyYearly !== false,
      notifyMonthly: body?.notifyMonthly === true,
    },
  });
  return apiOk({ id: created.id }, 201);
}
