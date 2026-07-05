# 💛 Kettesben

**Páros randiötlet-gyűjtemény és randinapló** — inspiráció, bakancslisták, közös emlékek és
partnerkedvezmények minden korosztályú párnak. Nem csak az összejövést segíti, az együtt
maradást is.

A teljes termék- és rendszerterv: **[SPECIFICATION.md](./SPECIFICATION.md)**

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
- ✉️ **E-mailek** — megerősítő és jelszó-visszaállító levelek, értesítő e-mailek a moderációs
  döntésekről; SMTP nélkül minden levél a moderációs felület „E-mail napló" fülén olvasható
- 🔑 **Jelszó-visszaállítás és e-mail-megerősítés** — egyszer használatos, hashelve tárolt, lejáró tokenekkel
- ⏰ **Évforduló-emlékeztető cron** — `GET /api/cron/emlekeztetok` (Bearer `CRON_SECRET`), a pár
  mindkét tagjának app-értesítés + e-mail, fordulónkénti deduplikálással

## Gyors indítás

```bash
npm install
npm run setup     # .env létrehozása + adatbázis séma + demó-adatok
npm run dev       # http://localhost:3000
```

### Demó fiókok (jelszó mindenhol: `titok123!`)

| E-mail | Szerep |
|---|---|
| `admin@kettesben.hu` | admin |
| `mod@kettesben.hu` | moderátor |
| `anna@example.com` | felhasználó — Bencével párban |
| `bence@example.com` | felhasználó — Annával párban |
| `kata@example.com` | felhasználó — pár nélkül |

## Parancsok

| Parancs | Leírás |
|---|---|
| `npm run dev` | fejlesztői szerver |
| `npm run build` && `npm start` | production build és indítás |
| `npm test` | egységtesztek (Vitest) — dátumlogika, jogosultsági szabályok |
| `npm run test:e2e` | böngészős füstteszt (playwright-core; futó szerver + friss seed kell hozzá) |
| `node e2e/phase2.mjs` | böngészős teszt a kommunikációs folyamatokra (megerősítés, jelszóreset, cron) |
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
src/components/    közös UI-komponensek
src/lib/           db, auth, session, jogosultságok, dátumlogika, feltöltés
src/lib/actions/   server actionök (auth, ideas, lists, couple, journal, moderation)
tests/             egységtesztek
e2e/               böngészős füstteszt
```
