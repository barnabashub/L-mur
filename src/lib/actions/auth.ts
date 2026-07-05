'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, destroySession } from '@/lib/session';
import { requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/client-ip';
import { issueToken, consumeToken } from '@/lib/tokens';
import { appUrl, sendMail } from '@/lib/mail';
import { passwordResetMail, verifyEmailMail } from '@/lib/mail-templates';
import { failTo, okTo, str } from './helpers';

const registerSchema = z.object({
  name: z.string().min(2, 'A név legalább 2 karakter legyen.').max(80),
  email: z.string().email('Érvénytelen e-mail cím.'),
  password: z.string().min(8, 'A jelszó legalább 8 karakter legyen.').max(128),
});

const RATE_MSG = 'Túl sok próbálkozás — várj egy percet, és próbáld újra.';

export async function register(formData: FormData) {
  if (!rateLimit(`register:${await clientIp()}`, 10, 60_000).allowed) {
    failTo('/regisztracio', RATE_MSG);
  }
  const parsed = registerSchema.safeParse({
    name: str(formData, 'name'),
    email: str(formData, 'email').toLowerCase(),
    password: formData.get('password'),
  });
  if (!parsed.success) failTo('/regisztracio', parsed.error.issues[0].message);

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) failTo('/regisztracio', 'Ezzel az e-mail címmel már regisztráltak.');

  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
  const token = await issueToken(user.id, 'EMAIL_VERIFY');
  await sendMail({ to: email, ...verifyEmailMail(name, appUrl(`/email-megerosites/${token}`)) });
  await createSession(user.id);
  okTo('/', 'Sikeres regisztráció — üdvözlünk a Kettesben-ben! Megerősítő e-mailt küldtünk.');
}

export async function resendVerification() {
  const user = await requireUser();
  if (user.emailVerifiedAt) okTo('/profil', 'Az e-mail címed már meg van erősítve.');
  const token = await issueToken(user.id, 'EMAIL_VERIFY');
  await sendMail({
    to: user.email,
    ...verifyEmailMail(user.name, appUrl(`/email-megerosites/${token}`)),
  });
  okTo('/profil', 'Új megerősítő e-mailt küldtünk.');
}

export async function requestPasswordReset(formData: FormData) {
  if (!rateLimit(`reset:${await clientIp()}`, 5, 60_000).allowed) {
    failTo('/elfelejtett-jelszo', RATE_MSG);
  }
  const email = str(formData, 'email').toLowerCase();
  if (!email) failTo('/elfelejtett-jelszo', 'Add meg az e-mail címedet.');

  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const token = await issueToken(user.id, 'PASSWORD_RESET');
    await sendMail({
      to: email,
      ...passwordResetMail(user.name, appUrl(`/jelszo-visszaallitas/${token}`)),
    });
  }
  // Szándékosan azonos üzenet akkor is, ha nincs ilyen fiók (user enumeration ellen).
  okTo('/belepes', 'Ha létezik fiók ezzel a címmel, elküldtük a visszaállító linket.');
}

export async function resetPassword(formData: FormData) {
  const token = str(formData, 'token');
  const password = formData.get('password');
  const back = `/jelszo-visszaallitas/${token}`;
  if (typeof password !== 'string' || password.length < 8) {
    failTo(back, 'A jelszó legalább 8 karakter legyen.');
  }

  const row = await consumeToken(token, 'PASSWORD_RESET');
  if (!row) failTo('/elfelejtett-jelszo', 'A link érvénytelen vagy lejárt. Kérj újat!');

  await db.user.update({
    where: { id: row.userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  okTo('/belepes', 'A jelszavad megváltozott — lépj be az újjal!');
}

export async function login(formData: FormData) {
  if (!rateLimit(`login:${await clientIp()}`, 10, 60_000).allowed) {
    failTo('/belepes', RATE_MSG);
  }
  const email = str(formData, 'email').toLowerCase();
  const password = formData.get('password');
  if (!email || typeof password !== 'string') failTo('/belepes', 'Add meg az adataidat.');

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    failTo('/belepes', 'Hibás e-mail cím vagy jelszó.');
  }
  if (user.status === 'SUSPENDED') {
    failTo('/belepes', 'A fiókodat felfüggesztették. Vedd fel a kapcsolatot a moderátorokkal.');
  }
  await createSession(user.id);
  okTo('/');
}

export async function logout() {
  await destroySession();
  okTo('/');
}
