/**
 * End-to-end füstteszt a fő felhasználói folyamatokra.
 *
 * Előfeltételek:
 *   1. friss demó-adatbázis:  npm run db:seed
 *   2. futó szerver:          npm run build && npm start  (vagy npm run dev)
 * Futtatás:                   npm run test:e2e
 *
 * A Chromium elérési útja a CHROMIUM_PATH környezeti változóval adható meg;
 * enélkül a playwright-core saját feloldását használja.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const results = [];
const ok = (name, cond) => {
  results.push(`${cond ? '✔' : '✘'} ${name}`);
  if (!cond) process.exitCode = 1;
};

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage();

async function login(email) {
  await page.goto(BASE + '/belepes');
  await page.fill('#email', email);
  await page.fill('#password', 'titok123!');
  await Promise.all([page.waitForNavigation(), page.click('button:has-text("Belépés")')]);
}
async function logout() {
  await Promise.all([page.waitForNavigation(), page.click('header button:has-text("Kilépés")')]);
}
async function submit(selector) {
  await Promise.all([page.waitForNavigation(), page.click(selector)]);
}

// 1) Belépés Annaként
await login('anna@example.com');
ok('login: fejlécben a név', (await page.textContent('header')).includes('Kiss Anna'));

// 2) Ötlet kipipálása
await page.goto(BASE + '/otletek?q=hajnali');
await Promise.all([page.waitForNavigation(), page.click('a:has-text("Hajnali napfelkelte-vadászat")')]);
await page.fill('#publicText', 'Fantasztikus volt a napfelkelte!');
await page.fill('#privateText', 'Bence végig fogta a kezem.');
await page.click('button:has-text("Kipipálom, megvolt!")');
await page.waitForSelector('text=Gratulálunk, kipipálva');
ok('pipálás: sikerüzenet', true);

// 3) A napló tartalmazza az új bejegyzést privát szöveggel
await page.goto(BASE + '/naplo');
const naplo = await page.textContent('main');
ok('napló: új bejegyzés látszik', naplo.includes('Hajnali napfelkelte-vadászat'));
ok('napló: privát szöveg látszik', naplo.includes('Bence végig fogta a kezem.'));

// 4) Bence (pár) látja; Kata (idegen) nem
await logout();
await login('bence@example.com');
await page.goto(BASE + '/naplo');
ok('pár másik tagja látja a privát emléket', (await page.textContent('main')).includes('Bence végig fogta a kezem.'));

await logout();
await login('kata@example.com');
await page.goto(BASE + '/naplo');
ok('idegen NEM látja más privát emlékét', !(await page.textContent('main')).includes('Bence végig fogta a kezem.'));

// 5) Értékelés leadása Kataként
await page.goto(BASE + '/otletek?q=hajnali');
await Promise.all([page.waitForNavigation(), page.click('a:has-text("Hajnali napfelkelte-vadászat")')]);
await page.check('input[name="stars"][value="5"]');
await page.fill('textarea[name="text"]', 'Csodálatos élmény volt!');
await page.click('button:has-text("Értékelés küldése")');
await page.waitForSelector('text=Köszönjük az értékelést');
ok('értékelés: sikerüzenet', true);

// 6) Moderátor: javaslat elfogadása
await logout();
await login('mod@kettesben.hu');
await page.goto(BASE + '/moderacio');
ok('moderáció: várakozó javaslat látszik', (await page.textContent('main')).includes('Kutyás menhelylátogatás'));
await page.click('button:has-text("Elfogadás és publikálás")');
await page.waitForSelector('text=Az ötlet elfogadva');
ok('moderáció: elfogadás sikerült', true);

// 7) Az elfogadott ötlet publikus, a beküldő értesítést kapott
await page.goto(BASE + '/otletek?q=menhely');
ok('elfogadott ötlet kereshető', (await page.textContent('main')).includes('Kutyás menhelylátogatás'));
await logout();
await login('anna@example.com');
await page.goto(BASE + '/ertesitesek');
ok('beküldő értesítést kapott', (await page.textContent('main')).includes('Elfogadtuk az ötletedet'));

// 8) Kuponkód belépve látszik
await page.goto(BASE + '/otletek?q=naplemente');
await page.click('a:has-text("Naplemente")');
await page.waitForSelector('text=VARBAN15');
ok('belépve látszik a kuponkód', true);

// 9) Bakancslista-haladás: Anna saját listáján a pár pipái számítanak
await page.goto(BASE + '/bakancslistak');
ok('gyári + saját listák látszanak', (await page.textContent('main')).includes('Budapesti klasszikusok') && (await page.textContent('main')).includes('Nagy terveink 2026-ra'));

await browser.close();
console.log(results.join('\n'));
