import crypto from 'crypto';
import { db } from '@/lib/db';
import { appUrl, sendMail } from '@/lib/mail';
import { coupleJoinedMail } from '@/lib/mail-templates';
import { apiError, apiOk, getApiUser } from '@/lib/api-auth';

function makeInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
}

/**
 * POST /api/v1/couple — pár-műveletek.
 * { action: 'invite' }            → meghívókód létrehozása
 * { action: 'join', code }        → csatlakozás kóddal
 * { action: 'leave' }             → szétkapcsolás
 */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiError(401, 'Bejelentkezés szükséges.');

  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === 'invite') {
    if (user.coupleId) return apiError(409, 'Már tartozol egy párhoz.');
    const couple = await db.couple.create({
      data: { inviteCode: makeInviteCode(), members: { connect: { id: user.id } } },
    });
    return apiOk({ inviteCode: couple.inviteCode }, 201);
  }

  if (action === 'join') {
    const code = typeof body?.code === 'string' ? body.code.toUpperCase().trim() : '';
    if (user.coupleId) return apiError(409, 'Már tartozol egy párhoz.');
    if (!code) return apiError(400, 'Add meg a meghívókódot.');

    const couple = await db.couple.findUnique({
      where: { inviteCode: code },
      include: { members: true },
    });
    if (!couple) return apiError(404, 'Ismeretlen meghívókód.');
    if (couple.members.length >= 2) return apiError(409, 'Ez a pár már teljes.');

    await db.user.update({ where: { id: user.id }, data: { coupleId: couple.id } });
    const partner = couple.members[0];
    if (partner) {
      await db.notification.create({
        data: {
          userId: partner.id,
          type: 'COUPLE',
          message: `${user.name} csatlakozott hozzád — mostantól közös a naplótok! 💛`,
          link: '/naplo',
        },
      });
      await sendMail({
        to: partner.email,
        ...coupleJoinedMail(partner.name, user.name, appUrl('/naplo')),
      });
    }
    return apiOk({ partnerName: partner?.name ?? null });
  }

  if (action === 'leave') {
    if (!user.coupleId) return apiError(409, 'Nem tartozol párhoz.');
    const coupleId = user.coupleId;
    await db.user.update({ where: { id: user.id }, data: { coupleId: null } });
    const remaining = await db.user.count({ where: { coupleId } });
    if (remaining === 0) await db.couple.delete({ where: { id: coupleId } });
    return apiOk({ left: true });
  }

  return apiError(400, 'Ismeretlen művelet.');
}
