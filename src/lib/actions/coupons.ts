'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { failTo, okTo, str } from './helpers';

function makeCouponCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () =>
    Array.from(crypto.randomBytes(4), (b) => alphabet[b % alphabet.length]).join('');
  return `KET-${part()}`;
}

/** Egyedi, beváltás-követett kuponkód kérése egy partneres ötlethez. */
export async function requestCoupon(formData: FormData) {
  const user = await requireUser();
  const ideaId = str(formData, 'ideaId');
  const back = `/otletek/${ideaId}`;

  const idea = await db.dateIdea.findUnique({ where: { id: ideaId }, include: { partner: true } });
  if (!idea || idea.status !== 'APPROVED' || !idea.partner) {
    failTo(back, 'Ehhez az ötlethez nem tartozik kedvezmény.');
  }

  // Ha van még be nem váltott kuponja ehhez a partnerhez, azt adjuk vissza.
  const existing = await db.couponRedemption.findFirst({
    where: { userId: user.id, partnerId: idea.partner.id, redeemedAt: null },
  });
  if (existing) {
    okTo(back, `A korábbi, még be nem váltott kuponkódod: ${existing.code}`);
  }

  const redemption = await db.couponRedemption.create({
    data: {
      code: makeCouponCode(),
      partnerId: idea.partner.id,
      userId: user.id,
      ideaId,
    },
  });
  revalidatePath('/profil');
  okTo(back, `Az egyedi kuponkódod: ${redemption.code} — mutasd fel a helyszínen! (A profilodon is megtalálod.)`);
}

/** Partner munkatárs: kód beváltása a helyszínen. */
export async function redeemCoupon(formData: FormData) {
  const user = await requireUser();
  if (user.role !== 'PARTNER' || !user.partnerId) failTo('/', 'Nincs jogosultságod.');

  const code = str(formData, 'code').toUpperCase();
  if (!code) failTo('/partner', 'Add meg a kuponkódot.');

  const redemption = await db.couponRedemption.findUnique({
    where: { code },
    include: { user: { select: { name: true } } },
  });
  if (!redemption || redemption.partnerId !== user.partnerId) {
    failTo('/partner', 'Ismeretlen kuponkód.');
  }
  if (redemption.redeemedAt) {
    failTo('/partner', `Ezt a kódot már beváltották (${redemption.redeemedAt.toLocaleDateString('hu-HU')}).`);
  }

  await db.couponRedemption.update({
    where: { id: redemption.id },
    data: { redeemedAt: new Date() },
  });
  revalidatePath('/partner');
  okTo('/partner', `Érvényes kupon — ${redemption.user.name} kedvezménye beváltva. ✔`);
}
