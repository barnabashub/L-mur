'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { failTo, okTo, str } from './helpers';

function makeInviteCode(): string {
  // Könnyen diktálható, összetéveszthető karakterek nélkül.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
}

export async function createInvite() {
  const user = await requireUser();
  if (user.coupleId) failTo('/par', 'Már tartozol egy párhoz.');

  await db.couple.create({
    data: { inviteCode: makeInviteCode(), members: { connect: { id: user.id } } },
  });
  revalidatePath('/par');
  okTo('/par', 'A meghívókód elkészült — oszd meg a pároddal!');
}

export async function joinCouple(formData: FormData) {
  const user = await requireUser();
  const code = str(formData, 'code').toUpperCase();
  if (user.coupleId) failTo('/par', 'Már tartozol egy párhoz.');
  if (!code) failTo('/par', 'Add meg a meghívókódot.');

  const couple = await db.couple.findUnique({
    where: { inviteCode: code },
    include: { members: true },
  });
  if (!couple) failTo('/par', 'Ismeretlen meghívókód.');
  if (couple.members.length >= 2) failTo('/par', 'Ez a pár már teljes.');

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
  }
  revalidatePath('/', 'layout');
  okTo('/par', partner ? `Összekapcsolódtatok ${partner.name} felhasználóval!` : 'Csatlakoztál.');
}

export async function leaveCouple() {
  const user = await requireUser();
  if (!user.coupleId) failTo('/par', 'Nem tartozol párhoz.');

  const coupleId = user.coupleId;
  await db.user.update({ where: { id: user.id }, data: { coupleId: null } });
  const remaining = await db.user.count({ where: { coupleId } });
  if (remaining === 0) await db.couple.delete({ where: { id: coupleId } });

  revalidatePath('/', 'layout');
  okTo('/par', 'A párkapcsolat szétkapcsolva. A saját emlékeid nálad maradtak.');
}
