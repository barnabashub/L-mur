# L’mur

> A név a **lemur** és az **amor** szavak keveréke — ejtsd: „lamúr". 🐒💜

**Páros randiötlet-gyűjtemény és randinapló** — inspiráció, bakancslisták, közös emlékek és
partnerkedvezmények minden korosztályú párnak. Nem csak az összejövést segíti, az együtt
maradást is.

A teljes termék- és rendszerterv: **[SPECIFICATION.md](./SPECIFICATION.md)** ·
Üzemeltetői kézikönyv: **[OPERATIONS.md](./OPERATIONS.md)**

**Design:** merész, fiatalos lila–fukszia arculat lime kiemelésekkel, teljes **dark mode**
támogatással (weben váltógombbal + rendszerkövetéssel, mobilon rendszerkövetéssel).
A logó két gyűrűsfarkú **lemur farka**, amelyek egy pontatlan szívet formálnak. 🐒💜

## Funkciók

- 🔎 **Ötletböngésző** — keresés, kategória-, helyszín- és szezonszűrők, rendezés értékelés/népszerűség szerint
- ⭐ **Értékelések** — 1–5 csillag + szöveges vélemény minden ötlethez
- ✔ **Kipipálás emlékkel** — dátum, fotó (publikus/privát kapcsolóval), publikus és privát szöveg
- 📝 **Bakancslisták** — „gyári" szerkesztett listák + saját listák, közös haladásjelzővel
- 💑 **Pár-összekapcsolás** — meghívókóddal; közös napló, közös dátumok, közös haladás
- 📖 **Randinapló** — idővonal a pár összes emlékéből, appon kívüli randik rögzítése; szigorúan privát
- 📅 **Fontos dátumok** — év- és hónapforduló-emlékeztetők
- 💡 **Ötletbeküldés** — bárki javasolhat; moderátori jóváhagyás értesítéssel
- 🛡️ **Moderátori felület** — javaslatok elbírálása, moderációs kérések, ötletszerkesztés, felhasználók figyelmeztetése/felfüggesztése, audit napló
- 🎟️ **Partnerkedvezmények** — kuponkódok bejelentkezett felhasználóknak (pl. vár, nemzeti park, kávézó)
- 🔔 **Értesítési központ** — moderációs döntések, figyelmeztetések, párkapcsolódás
- ♿ **Akadálymentesség** — szabványos akadálymentességi gomb a fejlécben (nagyobb betű,
  magas kontraszt, kevesebb mozgás — a böngésző megjegyzi); „ugrás a tartalomra" link,
  látható billentyűzet-fókusz; a programok akadálymentességi jelölőkkel címkézhetők
  (♿ kerekesszék, 🦯 látássérült, 🦻 hallássérült, 👶 babakocsi, 🪑 kevés séta) és
  ezekre szűrhetők a böngészőben és az API-ban is
- ✉️ **E-mailek** — megerősítő és jelszó-visszaállító levelek, értesítő e-mailek a moderációs
  döntésekről; SMTP nélkül minden levél a moderációs felület „E-mail napló" fülén olvasható
- 🔑 **Jelszó-visszaállítás és e-mail-megerősítés** — egyszer használatos, hashelve tárolt, lejáró tokenekkel
- ⏰ **Évforduló-emlékeztető cron** — `GET /api/cron/emlekeztetok` (Bearer `CRON_SECRET`), a pár
  mindkét tagjának app-értesítés + e-mail, fordulónkénti deduplikálással
- 📱 **Mobil alkalmazás (iOS + Android)** — Expo/React Native kliens a `mobile/` mappában, saját
  REST API-val (`/api/v1/*`, Bearer token); részletek: [mobile/README.md](./mobile/README.md)
- 🏠 **PWA** — a webapp kezdőképernyőre telepíthető (manifest + ikonok)
- 🗺️ **Valódi térképek (OpenStreetMap + Leaflet)** — minden térképes nézet mögött igazi
  térkép: az ötlettérkép (`/terkep`), az ötletoldal helyszíntérképe útvonaltervezés-gombbal,
  és a mobilapp is. **Helyszín megadása kereséssel**: a beküldő rákeres a helyre
  (pl. „Zamat kávézó Budapest") vagy a térképre kattint — koordinátát senkinek nem kell írnia
- 🔍 **Felfedezés** — „ötlet a mai napra" napi ajánló, szezonális főoldali kiemelések,
  kattintható #címkék az ötleteken
- 🎫 **Partnerprogram** — egyedi, beváltás-követett kuponkódok; partner önkiszolgáló felület
  (`/partner`): beváltás a helyszínen + statisztika
- 🛡️ **Üzemeltetés** — GitHub Actions CI (tesztek + build + API füstteszt + Docker),
  Docker + compose beépített cron-nal, `/api/health` életjel, `/api/metrics`
  Prometheus-metrikák, rate limiting, GDPR adatexport és fióktörlés;
  részletek: [OPERATIONS.md](./OPERATIONS.md)

## Gyors indítás

```bash
npm install
npm run setup     # .env létrehozása + adatbázis séma + demó-adatok
npm run dev       # http://localhost:3000
```

### Demó fiókok (jelszó mindenhol: `titok123!`)

| E-mail | Szerep |
|---|---|
| `admin@lmur.hu` | admin |
| `mod@lmur.hu` | moderátor |
| `anna@example.com` | felhasználó — Bencével párban |
| `bence@example.com` | felhasználó — Annával párban |
| `kata@example.com` | felhasználó — pár nélkül |
| `partner@zamat.hu` | partner munkatárs (kuponbeváltó felület) |

## Parancsok

| Parancs | Leírás |
|---|---|
| `npm run dev` | fejlesztői szerver |
| `npm run build` && `npm start` | production build és indítás |
| `npm test` | egységtesztek (Vitest) — dátumlogika, jogosultsági szabályok |
| `npm run test:e2e` | böngészős füstteszt (playwright-core; futó szerver + friss seed kell hozzá) |
| `node e2e/phase2.mjs` | böngészős teszt a kommunikációs folyamatokra (megerősítés, jelszóreset, cron) |
| `bash e2e/api-test.sh` | a REST API (v1) end-to-end tesztje (27 ellenőrzés) |
| `node e2e/map.mjs` | térkép és helyválasztó teszt (valódi OSM + geokódolás) |
| `npm run db:push` | Prisma séma szinkronizálása az adatbázisba |
| `npm run db:seed` | demó-adatok újratöltése |

## Architektúra dióhéjban

- **Next.js 15** (App Router, React Server Components + Server Actions) — a mutációk külön
  API-réteg nélkül, szerveroldali jogosultság-ellenőrzéssel futnak
- **Prisma + SQLite** — zéró konfigurációval fut; prodban a `DATABASE_URL` cseréjével PostgreSQL-re váltható
- **Saját auth** — bcrypt jelszóhash + aláírt JWT HttpOnly sütiben (`jose`)
- **Zod** validáció minden űrlap-bemeneten
- **Tailwind CSS** felület, magyar nyelven
- Képfeltöltés izolált modulban (`src/lib/uploads.ts`) — prodban S3-adapterre cserélhető
- **Levelezés** izolált modulban (`src/lib/mail.ts`): az `SMTP_*` env-változókkal nodemailer
  küld; enélkül a levelek az `EmailLog` táblába kerülnek, és a moderációs felületen olvashatók
- **Térkép és geokódolás**: Leaflet + OpenStreetMap csempék (API-kulcs nélkül); a helykeresést
  a saját szerverünk proxyzza (`/api/geocode` → Nominatim) — így betartható az 1 kérés/mp-es
  szabály, van cache, és a felhasználók IP-je sem kerül ki. Saját geokódoló a `GEOCODER_URL`
  env-változóval köthető be
- **Tokenek** (`src/lib/token-utils.ts` + `tokens.ts`): a nyers token csak az e-mailben utazik,
  az adatbázis SHA-256 hash-t tárol; egyszer használatos, lejáró, típushoz kötött

Az évforduló-emlékeztetőket ütemezett hívás küldi ki (pl. napi cron):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/emlekeztetok"
```

A láthatósági szabályok (mit lát a vendég / a pár / idegen felhasználó / moderátor) tiszta,
egységtesztelt függvényekben élnek: `src/lib/permissions.ts`.

## Projektstruktúra

```
prisma/            séma + seed
src/app/           oldalak (App Router) — otletek, bakancslistak, naplo, datumok,
                   par, profil, moderacio, partnerek, ertesitesek, belepes, regisztracio
src/app/api/v1/    REST API a mobil/natív klienseknek (Bearer token, CORS)
src/components/    közös UI-komponensek
src/lib/           db, auth, session, jogosultságok, dátumlogika, feltöltés, levelezés
src/lib/actions/   server actionök (auth, ideas, lists, couple, journal, moderation)
mobile/            Expo (React Native) mobilalkalmazás — iOS + Android
tests/             egységtesztek
e2e/               böngészős és API end-to-end tesztek
```

## REST API (v1)

A mobilapp (és bármilyen integráció) a `/api/v1/*` végpontokat használja `Authorization: Bearer <token>` fejléccel. Token: `POST /api/v1/auth/login` vagy `/auth/register`. Fő végpontok: `/me`, `/ideas`, `/ideas/:id`, `/ideas/:id/complete` (multipart képpel), `/ideas/:id/review`, `/lists`, `/lists/:id/items`, `/journal`, `/notifications`, `/couple`, `/dates`. Minden válasz `{ data }` vagy `{ error }` alakú; a webes láthatósági szabályok itt is érvényesek.
