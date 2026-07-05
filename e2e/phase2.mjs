/**
 * End-to-end teszt a 2. fázis (kommunikáció) folyamataira:
 * regisztráció + e-mail-megerősítés, jelszó-visszaállítás, évforduló-értesítés.
 *
 * Előfeltételek: friss seed (npm run db:seed) + futó szerver.
 * Futtatás: node e2e/phase2.mjs
 */
import { chromium } from 'playwright-core';
import { PrismaClient } from '@prisma/client';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const db = new PrismaClient();
const results = [];
const ok = (name, cond) => {
  results.push(`${cond ? '✔' : '✘'} ${name}`);
  if (!cond) process.exitCode = 1;
};

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage();

/** A legutóbbi e-mailből kiszedi az első linket (az EmailLog a dev-postafiók). */
async function latestMailLink(to, subjectPart) {
  const mail = await db.emailLog.findFirst({
    where: { to, subject: { contains: subjectPart } },
    orderBy: { createdAt: 'desc' },
  });
  return mail?.text.match(/https?:\/\/\S+/)?.[0] ?? null;
}

// 1) Regisztráció → megerősítő e-mail + figyelmeztető sáv
const email = `teszt-${Date.now()}@example.com`;
await page.goto(BASE + '/regisztracio');
await page.fill('#name', 'Teszt Tamara');
await page.fill('#email', email);
await page.fill('#password', 'teszt1234!');
await Promise.all([page.waitForNavigation(), page.click('button:has-text("Fiók létrehozása")')]);
ok('regisztráció: belépve', (await page.textContent('header')).includes('Teszt Tamara'));
ok('regisztráció: megerősítő sáv látszik', (await page.textContent('body')).includes('Erősítsd meg az e-mail címedet'));

const verifyLink = await latestMailLink(email, 'Erősítsd meg');
ok('megerősítő e-mail naplózva, linkkel', !!verifyLink);

// 2) Megerősítő link megnyitása → sáv eltűnik
await page.goto(verifyLink);
ok('megerősítés: sikeroldal', (await page.textContent('main')).includes('E-mail cím megerősítve'));
await page.goto(BASE + '/profil');
ok('profil: megerősítve jelvény', (await page.textContent('main')).includes('megerősítve'));
ok('megerősítő sáv eltűnt', !(await page.textContent('body')).includes('Erősítsd meg az e-mail címedet'));

// 3) Használt link másodszor már érvénytelen
await page.goto(verifyLink);
ok('használt link érvénytelen', (await page.textContent('main')).includes('érvénytelen vagy lejárt'));

// 4) Jelszó-visszaállítás Katának
await Promise.all([page.waitForNavigation(), page.click('header button:has-text("Kilépés")')]);
await page.goto(BASE + '/elfelejtett-jelszo');
await page.fill('#email', 'kata@example.com');
await Promise.all([page.waitForNavigation(), page.click('button:has-text("Visszaállító link küldése")')]);
ok('reset kérés: semleges visszajelzés', (await page.textContent('main')).includes('Ha létezik fiók'));

const resetLink = await latestMailLink('kata@example.com', 'Jelszó-visszaállítás');
ok('reset e-mail naplózva, linkkel', !!resetLink);

await page.goto(resetLink);
await page.fill('#password', 'ujjelszo123!');
await Promise.all([page.waitForNavigation(), page.click('button:has-text("Jelszó mentése")')]);
ok('reset: sikerüzenet', (await page.textContent('main')).includes('A jelszavad megváltozott'));

// 5) Régi jelszó már nem jó, az új igen
await page.fill('#email', 'kata@example.com');
await page.fill('#password', 'titok123!');
await page.click('button:has-text("Belépés")');
await page.waitForSelector('text=Hibás e-mail cím vagy jelszó');
ok('régi jelszó elutasítva', true);
await page.fill('#email', 'kata@example.com');
await page.fill('#password', 'ujjelszo123!');
await Promise.all([page.waitForNavigation(), page.click('button:has-text("Belépés")')]);
ok('új jelszóval belépés', (await page.textContent('header')).includes('Szabó Kata'));

// 6) Évforduló-cron eredménye: Anna kapott app-értesítést és e-mailt
const cronNotif = await db.notification.findFirst({ where: { type: 'ANNIVERSARY' } });
ok('évforduló app-értesítés létrejött (cron)', !!cronNotif);
const annivMail = await db.emailLog.findFirst({ where: { subject: { contains: 'évforduló' } } });
ok('évforduló e-mail naplózva (cron)', !!annivMail);

await browser.close();
await db.$disconnect();
console.log(results.join('\n'));
