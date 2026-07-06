import 'server-only';
import { db } from './db';

/**
 * Levelezőmodul.
 * - Ha az SMTP_* környezeti változók be vannak állítva, nodemailerrel küld.
 * - Enélkül az e-mail csak az EmailLog táblába kerül ("LOGGED") — fejlesztés
 *   és demó közben a moderációs felület „E-mail napló" fülén olvasható.
 * Minden küldés naplózódik; a hívók számára a küldési hiba sosem végzetes.
 */

export function appUrl(path = ''): string {
  const base = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return base + path;
}

export async function sendMail(opts: { to: string; subject: string; text: string }) {
  let status: 'SENT' | 'LOGGED' | 'FAILED' = 'LOGGED';
  let error: string | null = null;

  if (process.env.SMTP_HOST) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const port = Number(process.env.SMTP_PORT ?? 587);
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM ?? 'L’mur <no-reply@lmur.hu>',
        ...opts,
      });
      status = 'SENT';
    } catch (e) {
      status = 'FAILED';
      error = (e as Error).message;
    }
  }

  try {
    await db.emailLog.create({ data: { ...opts, status, error } });
  } catch {
    // a naplózás hibája sem akaszthatja meg a fő folyamatot
  }
  return status !== 'FAILED';
}
