import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { upcomingAnniversaries } from '@/lib/dates';
import { formatDate } from '@/lib/format';
import { appUrl, sendMail } from '@/lib/mail';
import { anniversaryMail } from '@/lib/mail-templates';

/**
 * Évforduló-emlékeztetők kiküldése (app-értesítés + e-mail).
 *
 * Ütemezetten hívandó (pl. napi egyszer, cron):
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/emlekeztetok
 *
 * Minden fordulóról (ReminderLog dedupe révén) pontosan egyszer értesítünk,
 * legfeljebb LEAD_DAYS nappal előtte. A pár mindkét tagja kap értesítést.
 */
const LEAD_DAYS = 7;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  const url = new URL(req.url);
  if (!secret || (auth !== `Bearer ${secret}` && url.searchParams.get('titok') !== secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const dates = await db.importantDate.findMany({
    include: {
      user: {
        include: { couple: { include: { members: true } } },
      },
    },
  });

  const today = new Date();
  let sent = 0;
  let skipped = 0;

  for (const d of dates) {
    const hits = upcomingAnniversaries([d], today, LEAD_DAYS);
    for (const a of hits) {
      // Dedupe: erről a fordulóról értesítettünk-e már?
      try {
        await db.reminderLog.create({
          data: { importantDateId: d.id, kind: a.kind, occurrence: a.date },
        });
      } catch {
        skipped++;
        continue; // már kiment
      }

      const recipients = d.user.couple?.members ?? [d.user];
      const kindText = a.kind === 'yearly' ? 'évforduló' : 'hónapforduló';
      const when = a.daysAway === 0 ? 'MA van' : `${a.daysAway} nap múlva lesz`;

      for (const r of recipients) {
        await db.notification.create({
          data: {
            userId: r.id,
            type: 'ANNIVERSARY',
            message: `${when} a(z) „${d.title}" ${a.count}. ${kindText}ja (${formatDate(a.date)}) 🎉`,
            link: '/datumok',
          },
        });
        await sendMail({
          to: r.email,
          ...anniversaryMail(r.name, d.title, a.count, a.kind, formatDate(a.date), a.daysAway, appUrl('/otletek')),
        });
        sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, ertesitesek: sent, kihagyva_mar_kikuldott: skipped });
}
