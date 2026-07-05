import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { db } from './db';
import { getSessionUserId } from './session';

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

async function loadUser(id: string) {
  return db.user.findUnique({
    where: { id },
    include: { couple: { include: { members: { select: { id: true, name: true } } } } },
  });
}

/** Az aktuális, aktív felhasználó — vagy null. Kérésenként cache-elve. */
export const getCurrentUser = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await loadUser(userId);
  if (!user || user.status !== 'ACTIVE') return null;
  return user;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/belepes');
  return user;
}

export async function requireModerator(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== 'MODERATOR' && user.role !== 'ADMIN') redirect('/');
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') redirect('/');
  return user;
}

/** A pár másik tagja (ha van). */
export function partnerOf(user: CurrentUser) {
  return user.couple?.members.find((m) => m.id !== user.id) ?? null;
}

/** A felhasználó és párja azonosítói — a napló és a privát tartalmak köre. */
export function coupleUserIds(user: CurrentUser): string[] {
  return user.couple ? user.couple.members.map((m) => m.id) : [user.id];
}
