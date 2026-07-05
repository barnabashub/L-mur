import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { apiError, apiOk, createApiToken } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'ismeretlen';
  if (!rateLimit(`api-login:${ip}`, 10, 60_000).allowed) {
    return apiError(429, 'Túl sok próbálkozás — várj egy percet.');
  }
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) return apiError(400, 'Add meg az e-mail címet és a jelszót.');

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return apiError(401, 'Hibás e-mail cím vagy jelszó.');
  }
  if (user.status === 'SUSPENDED') {
    return apiError(403, 'A fiókodat felfüggesztették.');
  }

  const token = await createApiToken(user.id);
  return apiOk({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
