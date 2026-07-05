import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiError, apiOk, createApiToken } from '@/lib/api-auth';
import { issueToken } from '@/lib/tokens';
import { appUrl, sendMail } from '@/lib/mail';
import { verifyEmailMail } from '@/lib/mail-templates';

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(400, 'Érvénytelen adatok: név, e-mail és legalább 8 karakteres jelszó kell.');

  const email = parsed.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) {
    return apiError(409, 'Ezzel az e-mail címmel már regisztráltak.');
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });
  const verifyToken = await issueToken(user.id, 'EMAIL_VERIFY');
  await sendMail({ to: email, ...verifyEmailMail(user.name, appUrl(`/email-megerosites/${verifyToken}`)) });

  const token = await createApiToken(user.id);
  return apiOk({ token, user: { id: user.id, name: user.name, email: user.email } }, 201);
}
