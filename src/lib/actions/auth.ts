'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, destroySession } from '@/lib/session';
import { failTo, okTo, str } from './helpers';

const registerSchema = z.object({
  name: z.string().min(2, 'A név legalább 2 karakter legyen.').max(80),
  email: z.string().email('Érvénytelen e-mail cím.'),
  password: z.string().min(8, 'A jelszó legalább 8 karakter legyen.').max(128),
});

export async function register(formData: FormData) {
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
  await createSession(user.id);
  okTo('/', 'Sikeres regisztráció — üdvözlünk a Kettesben-ben!');
}

export async function login(formData: FormData) {
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
