# Kettesben — üzemeltetői kézikönyv

Ez a dokumentum a Kettesben éles üzemeltetéséhez szükséges tudnivalókat tartalmazza:
telepítés, konfiguráció, monitoring, mentés, riasztások és incidenskezelés.

## 1. Telepítés

### Docker (ajánlott)

```bash
cp .env.example .env        # állítsd be: SESSION_SECRET, CRON_SECRET, APP_URL, SMTP_*
docker compose up -d --build
# első indításhoz demó-adatokkal:
SEED_DEMO=1 docker compose up -d --build
```

- Az alkalmazás a `3000`-es porton fut; elé HTTPS-terminráló reverse proxy javasolt
  (Caddy/nginx/Traefik). A Caddy két sorból megoldja a TLS-t:
  `kettesben.hu { reverse_proxy localhost:3000 }`
- Az adatbázis és a feltöltött képek a `./data` kötetben élnek — **ezt kell menteni**.
- A `cron` konténer minden nap 7:00-kor kiküldi az évforduló-emlékeztetőket.

### Docker nélkül (PM2/systemd)

```bash
npm ci && cp .env.example .env && npx prisma db push && npm run build
npx next start -p 3000     # PM2: pm2 start "npx next start -p 3000" --name kettesben
# cron (naponta): 0 7 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/emlekeztetok
```

## 2. Konfiguráció (környezeti változók)

| Változó | Kötelező | Leírás |
|---|---|---|
| `DATABASE_URL` | ✔ | SQLite: `file:/data/kettesben.db`; Postgres: `postgresql://…` |
| `SESSION_SECRET` | ✔ | munkamenet- és API-tokenek aláírókulcsa — erős, egyedi titok! Cseréje minden munkamenetet érvénytelenít. |
| `CRON_SECRET` | ✔ | az emlékeztető-végpont Bearer titka |
| `APP_URL` | ✔ | publikus URL — az e-mailekben lévő linkekhez |
| `SMTP_HOST/PORT/USER/PASS/FROM` | – | e-mail küldés; enélkül a levelek csak az adatbázisba naplózódnak (moderációs felület → E-mail napló) |
| `METRICS_TOKEN` | – | ha be van állítva, a `/api/metrics` csak ezzel a Bearer tokennel érhető el |
| `SEED_DEMO` | – | `1` esetén induláskor demó-adatok töltődnek be (prodban SOHA) |
| `PORT` | – | alapértelmezés: 3000 |

## 3. Monitoring és riasztás

### Végpontok

- **`GET /api/health`** — életjel (JSON): app + adatbázis állapot, verzió, uptime.
  200 = egészséges, 503 = az adatbázis nem elérhető. Erre kösd: Docker healthcheck
  (beépítve), Kubernetes liveness/readiness, UptimeRobot/BetterStack külső figyelés.
- **`GET /api/metrics`** — Prometheus-formátum (`METRICS_TOKEN`-nel védhető).
  Üzleti metrikák (felhasználók, ötletek, pipák, kuponok…) + folyamat-metrikák.

### Prometheus bekötés

```yaml
scrape_configs:
  - job_name: kettesben
    metrics_path: /api/metrics
    authorization: { credentials: '<METRICS_TOKEN>' }
    static_configs: [{ targets: ['kettesben.hu'] }]
    scheme: https
```

### Javasolt riasztások

| Riasztás | Feltétel | Jelentés |
|---|---|---|
| App down | `/api/health` != 200 3 percen át | kiesés — azonnali beavatkozás |
| Moderációs torlódás | `kettesben_ideas_pending_total > 20` 24 órán át | kevés a moderátor / elakadt a folyamat |
| E-mail hibák | `kettesben_emails_failed_total` növekszik | SMTP-hitelesítés/limit probléma |
| Memória | `process_resident_memory_bytes > 1.5e9` | memória-szivárgás gyanú, újraindítás + vizsgálat |

### Hibakövetés (Sentry — opcionális)

`npx @sentry/wizard@latest -i nextjs` felteszi a szükséges konfigurációt; a DSN-t env-ből
add meg. A szerveroldali hibák (server actionök, API route-ok) automatikusan bekerülnek.

### Naplók

- Docker: `docker compose logs -f app` (JSON-driverrel Loki/CloudWatch alá köthető).
- A moderátori műveletek az alkalmazáson belüli **audit naplóban** (Moderáció → Audit napló),
  a kimenő levelek az **E-mail naplóban** is visszakereshetők.

## 4. Mentés és visszaállítás

- **SQLite**: a `./data` könyvtár másolása (app leállítása nélkül: `sqlite3 data/kettesben.db ".backup data/backup-$(date +%F).db"`). Javasolt: napi cron + heti offsite másolat.
- **Feltöltött képek**: `./data/uploads` (a compose ide köti a `public/uploads`-ot).
- **Postgres**: `pg_dump` naponta; visszaállítás `psql < dump.sql`.
- Visszaállítás-teszt: negyedévente állítsd vissza a mentést egy ideiglenes környezetbe
  és futtasd le: `curl localhost:3000/api/health`.

## 5. Skálázás és éles architektúra

| Terület | Jelen állapot | Váltás nagyobb terhelésnél |
|---|---|---|
| Adatbázis | SQLite (fájl) | PostgreSQL — `schema.prisma` provider + `DATABASE_URL` csere, `prisma db push` |
| Képtár | lokális `public/uploads` | S3-kompatibilis tár — egyetlen modul cseréje: `src/lib/uploads.ts` |
| Rate limit | folyamaton belüli (fix ablak) | Redis-alapú — a `src/lib/rate-limit.ts` felülete változatlan maradhat |
| E-mail | SMTP (nodemailer) | tranzakciós szolgáltató (Resend/Postmark/SES) — `src/lib/mail.ts` |
| Több példány | 1 konténer | LB mögött több példány: ehhez Postgres + S3 + Redis szükséges (a lokális fájl-állapot miatt) |

## 6. Verziófrissítés menete

1. `git pull` → CI zöld? (egységtesztek + build + API füstteszt + mobil typecheck + docker build)
2. Mentés (4. pont).
3. `docker compose up -d --build` — a belépő script automatikusan futtatja a
   sémamigrációt (`prisma db push`).
4. Ellenőrzés: `/api/health` 200, főoldal betölt, próba-belépés a demó fiókkal.
5. Probléma esetén rollback: előző image + adatmentés visszaállítása.

## 7. Incidens-runbook (gyakori esetek)

| Tünet | Valószínű ok | Teendő |
|---|---|---|
| 503 a /api/health-en | DB-fájl zárolva/sérült, kötet betelt | `df -h`; SQLite integritás: `sqlite3 kettesben.db "PRAGMA integrity_check"`; szükség esetén mentés-visszaállítás |
| Senki nem tud belépni | SESSION_SECRET megváltozott | szándékos volt? ha nem: állítsd vissza a korábbi titkot |
| Nem mennek az e-mailek | SMTP hiba | Moderáció → E-mail napló: FAILED sorok hibaüzenete; SMTP-fiók limit/jelszó ellenőrzése |
| 429-ek éles felhasználóknál | közös kimenő IP (céges NAT) veri ki a rate limitet | limit emelése az érintett útvonalon, vagy Redis-alapú, felhasználónkénti limit |
| Lassulás | SQLite írási sorbanállás | mérd: `/api/metrics` + naplók; tartós terhelésnél Postgres-váltás (5. pont) |
| Betelt a lemez | feltöltött képek | régi/árva fájlok archiválása S3-ra; hosszú távon S3-adapter |

## 8. Biztonsági emlékeztetők

- A titkok (`SESSION_SECRET`, `CRON_SECRET`, SMTP-jelszó) csak env-ben éljenek, a repóba
  soha ne kerüljenek.
- HTTPS kötelező éles környezetben (a munkamenet-süti `secure` production módban).
- A jelszavak bcrypt-tel hashelve, a reset/megerősítő tokenek SHA-256 hash-ként tárolódnak.
- GDPR: a felhasználó maga exportálhatja adatait (`/api/export`) és törölheti fiókját;
  törléskor a személyes adatok véglegesen törlődnek, a közösségi tartalom anonimizálódik.
