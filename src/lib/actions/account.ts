'use server';

import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { destroySession } from '@/lib/session';
import { failTo, okTo, str } from './helpers';

/**
 * GDPR: fiók végleges törlése.
 * - A személyes tartalmak (pipák, emlékek, értékelések, listák, dátumok,
 *   értesítések, kuponok, jelzések, tokenek) törlődnek.
 * - A jóváhagyott, közösségnek szánt ötletek megmaradnak, egy "Törölt
 *   felhasználó" rendszerfiókhoz rendelve; a függő/elutasított javaslatok törlődnek.
 * - Moderátor/admin fiók nem törölhető így (előbb a szerepkört kell leadni).
 */
export async function deleteAccount(formData: FormData) {
  const user = await requireUser();
  if (user.role === 'MODERATOR' || user.role === 'ADMIN') {
    failTo('/profil', 'Moderátori/admin fiók nem törölhető — előbb add le a szerepkört egy adminnál.');
  }
  const password = formData.get('password');
  if (typeof password !== 'string' || password.length === 0) {
    failTo('/profil', 'A törléshez add meg a jelszavadat.');
  }
  const fresh = await db.user.findUnique({ where: { id: user.id } });
  if (!fresh || !(await bcrypt.compare(password, fresh.passwordHash))) {
    failTo('/profil', 'Hibás jelszó — a fiók nem lett törölve.');
  }
  if (str(formData, 'confirm') !== 'TÖRLÉS') {
    failTo('/profil', 'A megerősítő mezőbe pontosan ezt írd: TÖRLÉS');
  }

  // Jóváhagyott ötletek átadása a rendszer-fióknak.
  const ghost = await db.user.upsert({
    where: { email: 'torolt@kettesben.hu' },
    create: {
      email: 'torolt@kettesben.hu',
      name: 'Törölt felhasználó',
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
      status: 'SUSPENDED',
    },
    update: {},
  });

  const coupleId = user.coupleId;
  await db.$transaction([
    db.dateIdea.updateMany({
      where: { submitterId: user.id, status: 'APPROVED' },
      data: { submitterId: ghost.id },
    }),
    db.dateIdea.deleteMany({ where: { submitterId: user.id } }),
    db.review.deleteMany({ where: { userId: user.id } }),
    db.completion.deleteMany({ where: { userId: user.id } }),
    db.memory.deleteMany({ where: { userId: user.id } }),
    db.importantDate.deleteMany({ where: { userId: user.id } }),
    db.bucketList.deleteMany({ where: { ownerId: user.id } }),
    db.moderationRequest.deleteMany({ where: { userId: user.id } }),
    db.notification.deleteMany({ where: { userId: user.id } }),
    db.couponRedemption.deleteMany({ where: { userId: user.id } }),
    // Az audit napló megmarad, de a személyhez kötés megszűnik.
    db.moderationAction.updateMany({
      where: { targetUserId: user.id },
      data: { targetUserId: null },
    }),
    db.user.delete({ where: { id: user.id } }),
  ]);
  if (coupleId) {
    const remaining = await db.user.count({ where: { coupleId } });
    if (remaining === 0) await db.couple.delete({ where: { id: coupleId } });
  }

  await destroySession();
  okTo('/', 'A fiókod és a személyes adataid véglegesen törölve. Vigyázzatok egymásra! 💛');
}
