import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/** GDPR: a bejelentkezett felhasználó összes adatának exportja (JSON letöltés). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Bejelentkezés szükséges.' }, { status: 401 });

  const [ideas, reviews, completions, memories, importantDates, lists, requests, notifications, coupons] =
    await Promise.all([
      db.dateIdea.findMany({ where: { submitterId: user.id } }),
      db.review.findMany({ where: { userId: user.id }, include: { idea: { select: { title: true } } } }),
      db.completion.findMany({ where: { userId: user.id }, include: { idea: { select: { title: true } } } }),
      db.memory.findMany({ where: { userId: user.id } }),
      db.importantDate.findMany({ where: { userId: user.id } }),
      db.bucketList.findMany({
        where: { ownerId: user.id },
        include: { items: { include: { idea: { select: { title: true } } } } },
      }),
      db.moderationRequest.findMany({ where: { userId: user.id } }),
      db.notification.findMany({ where: { userId: user.id } }),
      db.couponRedemption.findMany({ where: { userId: user.id }, include: { partner: { select: { name: true } } } }),
    ]);

  const payload = {
    exportalva: new Date().toISOString(),
    profil: {
      nev: user.name,
      email: user.email,
      csatlakozas: user.createdAt,
      emailMegerositve: user.emailVerifiedAt,
      par: user.couple?.members.filter((m) => m.id !== user.id).map((m) => m.name) ?? [],
    },
    bekuldottOtletek: ideas,
    ertekelesek: reviews,
    teljesitesek: completions,
    emlekek: memories,
    fontosDatumok: importantDates,
    bakancslistak: lists,
    moderaciosKeresek: requests,
    ertesitesek: notifications,
    kuponok: coupons,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="kettesben-adataim.json"',
    },
  });
}
