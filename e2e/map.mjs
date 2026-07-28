/**
 * Térkép- és helyválasztó end-to-end teszt (valódi OpenStreetMap + Nominatim).
 *
 * Előfeltételek: friss seed (npm run db:seed) + futó szerver.
 * Futtatás: node e2e/map.mjs
 *
 * Megjegyzés a csempékről: zárt hálózaton (pl. CI-sandbox) a headless böngésző
 * nem éri el közvetlenül a tile.openstreetmap.org-ot, ezért a csempe-kéréseket
 * a Node oldali fetch szolgálja ki — a képek így is a valódi OSM-ből jönnek.
 * TILE_PASSTHROUGH=1 esetén az átirányítás kimarad (nyílt hálózaton).
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
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });

if (process.env.TILE_PASSTHROUGH !== '1') {
  await page.route('**://tile.openstreetmap.org/**', async (route) => {
    try {
      const res = await fetch(route.request().url(), { headers: { 'User-Agent': 'Lmur-e2e/1.0' } });
      route.fulfill({ status: res.status, contentType: 'image/png', body: Buffer.from(await res.arrayBuffer()) });
    } catch {
      route.abort();
    }
  });
}

const tilesLoaded = () =>
  page.waitForFunction(
    () => [...document.querySelectorAll('img.leaflet-tile')].filter((i) => i.complete && i.naturalWidth > 0).length > 3,
    { timeout: 25000 }
  );

async function login(email) {
  await page.goto(BASE + '/belepes');
  await page.fill('#email', email);
  await page.fill('#password', 'titok123!');
  await Promise.all([page.waitForNavigation(), page.click('button:has-text("Belépés")')]);
}

// 1) /terkep — valódi Leaflet térkép, OSM csempékkel és markerekkel
await page.goto(BASE + '/terkep');
await page.waitForSelector('.leaflet-container', { timeout: 20000 });
await tilesLoaded();
const tileUrl = await page.getAttribute('img.leaflet-tile', 'src');
ok('/terkep: valódi OSM csempék töltődnek', /tile\.openstreetmap\.org/.test(tileUrl ?? ''));
const pins = await page.locator('.lmur-pin').count();
ok(`/terkep: markerek a térképen (${pins} db)`, pins >= 8);
ok(
  '/terkep: OpenStreetMap attribúció megvan',
  (await page.textContent('.leaflet-control-attribution')).includes('OpenStreetMap')
);

await page.locator('.lmur-pin').first().click();
await page.waitForSelector('.leaflet-popup-content', { timeout: 10000 });
ok('/terkep: marker popup megnyílik', (await page.textContent('.leaflet-popup-content')).trim().length > 3);

// 2) Helyválasztó: valódi geokódolás kereséssel
await login('anna@example.com');
await page.goto(BASE + '/otletek/uj');
await page.waitForSelector('#helykereso', { timeout: 15000 });
ok('beküldés: nincs nyers koordináta-mező', (await page.locator('input[type="number"][name="lat"]').count()) === 0);

await page.fill('#helykereso', 'Halászbástya Budapest');
await page.click('button:has-text("Keresés")');
await page.waitForSelector('ul li button', { timeout: 25000 });
const firstResult = (await page.textContent('ul li button')) ?? '';
ok('geokódolás: valódi találat a keresőből', /hal[áa]szb[áa]stya/i.test(firstResult));

await page.click('ul li button');
await page.waitForFunction(() => document.querySelector('input[name="lat"]')?.value?.length > 0, { timeout: 10000 });
const lat = Number(await page.inputValue('input[name="lat"]'));
const lng = Number(await page.inputValue('input[name="lng"]'));
ok('geokódolás: a kiválasztás kitölti a nevet', (await page.inputValue('#locationLabel')).length > 3);
ok(`geokódolás: a koordináta a Halászbástyára mutat (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
  Math.abs(lat - 47.5022) < 0.02 && Math.abs(lng - 19.0344) < 0.02);

// 3) Beküldés → moderátori jóváhagyás → a koordináta megmarad és térképen látszik
await page.fill('#title', 'Térképes tesztötlet');
await page.fill('#description', 'Ez egy legalább húsz karakteres leírás a térképes helyválasztó teszteléséhez.');
await page.selectOption('#category', 'Kultúra');
await Promise.all([page.waitForNavigation(), page.click('button:has-text("Javaslat beküldése")')]);
ok('beküldés: sikeres', (await page.textContent('main')).includes('moderátorok hamarosan átnézik'));

await Promise.all([page.waitForNavigation(), page.click('header button:has-text("Kilépés")')]);
await login('mod@lmur.hu');
await page.goto(BASE + '/moderacio');
// Célzottan a most beküldött javaslat kártyáján — a sorban más is várakozhat.
await page
  .locator('section', { hasText: 'Térképes tesztötlet' })
  .locator('button:has-text("Elfogadás és publikálás")')
  .first()
  .click();
await page.waitForSelector('text=Az ötlet elfogadva');

await page.goto(BASE + '/otletek?q=Térképes%20tesztötlet');
await Promise.all([page.waitForNavigation(), page.click('a:has-text("Térképes tesztötlet")')]);
await page.waitForSelector('.leaflet-container', { timeout: 20000 });
await tilesLoaded();
ok('ötletoldal: térkép a beküldött helyszínnel', true);
ok('ötletoldal: útvonaltervezés gomb', (await page.textContent('main')).includes('Útvonaltervezés'));

// 4) Térképre kattintás → fordított geokódolás tölti a mezőket
await page.goto(BASE + '/otletek/uj');
await page.waitForSelector('.leaflet-container', { timeout: 20000 });
await tilesLoaded();
const box = await page.locator('.leaflet-container').boundingBox();
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForFunction(() => document.querySelector('input[name="lat"]')?.value?.length > 0, { timeout: 15000 });
const clicked = Number(await page.inputValue('input[name="lat"]'));
ok('térképre kattintás: koordináta beáll', clicked > 40 && clicked < 55);
await page.waitForFunction(() => document.querySelector('#locationLabel')?.value?.length > 2, { timeout: 20000 });
ok('térképre kattintás: fordított geokódolás nevet ad', (await page.inputValue('#locationLabel')).length > 2);

await browser.close();
console.log(results.join('\n'));
