# Kettesben — páros randiötlet-gyűjtemény és randinapló

> Rendszerterv és termékspecifikáció — v1.0
> Az eredeti ötletjegyzet feldolgozása, professzionális kiegészítésekkel és bővített scope-pal.

---

## 1. Vízió és célok

A **Kettesben** egy webalkalmazás, amely pároknak segít minőségi együtt töltött időt tervezni és megélni:

- **Inspiráció**: gondozott randiötlet-gyűjtemény — szép helyek, események, és helytől független ötletek.
- **Bakancslista**: „gyári" (szerkesztett) és saját listák, amelyekben a pár pipálja a teljesített randikat.
- **Emlék**: minden teljesítéshez kép és szöveges emlék tartozik — ebből épül a pár privát randinaplója.
- **Közösség**: publikus értékelések, publikus emlékek, felhasználói ötletbeküldés moderációval.
- **Kedvezmények**: partnerhelyszíneken (vár, kávézó, nemzeti park…) az app használói kedvezményt kapnak.

**Célközönség:** minden korosztályú párok — fiatalok, idősebbek, családos párok. Az app nemcsak az összejövést, hanem az **együtt maradást** is támogatja.

**Ami tudatosan NEM cél:** közösségi média jellegű működés. Nincs követés, nincs hírfolyam, nincs like-vadászat. A publikus tartalom az ötletek köré szerveződik (értékelések, publikus emlékek egy-egy ötlet oldalán), nem profilok köré. *(Az eredeti jegyzet nyitott kérdésére — „lehessen-e követni másik profilt?" — a döntés: **nem**, mert social feed irányba vinné a terméket.)*

## 2. Szerepkörök és jogosultságok

| Képesség | Vendég | Felhasználó | Moderátor | Admin |
|---|---|---|---|---|
| Ötletek böngészése, értékelések olvasása | ✔ | ✔ | ✔ | ✔ |
| Regisztráció / belépés | ✔ | — | — | — |
| Pár összekapcsolása meghívókóddal | | ✔ | ✔ | ✔ |
| Ötletjavaslat beküldése | | ✔ | ✔ | ✔ |
| Ötlethez moderációt/szerkesztést kérni | | ✔ | ✔ | ✔ |
| Bakancslista létrehozás, ötlet hozzáadás | | ✔ | ✔ | ✔ |
| Randi kipipálása (kép + emlék, publikus/privát) | | ✔ | ✔ | ✔ |
| Értékelés (csillag + szöveg) | | ✔ | ✔ | ✔ |
| Saját randinapló megtekintése, appon kívüli emlék rögzítése | | ✔ | ✔ | ✔ |
| Fontos dátumok, évforduló-emlékeztetők | | ✔ | ✔ | ✔ |
| Partnerkedvezmény kuponkód megtekintése | | ✔ | ✔ | ✔ |
| Ötlet közvetlen feltöltése és szerkesztése | | | ✔ | ✔ |
| Javaslatok moderálása (elfogad / visszadob üzenettel) | | | ✔ | ✔ |
| Moderációs kérések kezelése | | | ✔ | ✔ |
| Felhasználó figyelmeztetése / felfüggesztése / visszaállítása | | | ✔ | ✔ |
| Partnerek (kedvezmények) kezelése | | | | ✔ |
| Moderátor kinevezése | | | | ✔ |

A moderátor mindent tud, amit a felhasználó; az admin mindent, amit a moderátor.

## 3. Fő fogalmak és adatmodell

### 3.1 Entitások

- **User** — profil: név, e-mail, jelszóhash, szerepkör (`USER | MODERATOR | ADMIN`), állapot (`ACTIVE | SUSPENDED`), csatlakozás dátuma, opcionális `coupleId`.
- **Couple** — két felhasználót összekötő entitás; meghívókóddal jön létre. A pároldal: közös randinapló + közös fontos dátumok.
- **DateIdea** — randiötlet: cím, leírás, kép, kategória, elhelyezkedés (helységnév) *vagy* helyfüggetlen jelölés, szezonális/időpontfüggő jelleg (pl. „május–június", konkrét esemény-dátum), beküldő, létrehozás/frissítés dátuma, állapot (`PENDING | APPROVED | REJECTED`), opcionális partner-kapcsolat (kedvezmény). Származtatott: átlagértékelés, teljesítők száma.
- **Review** — értékelés: ötlet + felhasználó (egyedi páros), 1–5 csillag, opcionális szöveg. Mindig publikus.
- **Completion** — teljesítés (pipa): ötlet + felhasználó, dátum, opcionális kép, `imagePublic` kapcsoló, publikus szöveg (opcionális), privát szöveg (opcionális). A privát rész csak a pár két tagjának látszik.
- **Memory** — appon kívüli randi emléke a naplóba: cím, dátum, kép, szöveg. Mindig privát (a pár látja).
- **BucketList** — bakancslista: gyári (`isSystem`, nincs tulajdonos) vagy felhasználói; cím, leírás, elemek (ötlet-hivatkozások). Haladás = a pár által teljesített elemek aránya.
- **ImportantDate** — fontos dátum (megismerkedés, esküvő…): cím, dátum, év-/hónapforduló értesítés kapcsolók. A pár mindkét tagja látja.
- **Partner** — kedvezménypartner: név, leírás, weboldal, kedvezmény szövege, kuponkód. Ötletekhez kapcsolható.
- **ModerationRequest** — felhasználói kérés egy ötlet javítására/moderálására: üzenet, állapot (`OPEN | RESOLVED`), moderátori válasz.
- **ModerationAction** — audit napló: típus (`APPROVE | REJECT | EDIT | WARN | SUSPEND | UNSUSPEND | RESOLVE_REQUEST`), moderátor, cél (felhasználó és/vagy ötlet), üzenet, időpont.
- **Notification** — app-on belüli értesítés: címzett, típus, szöveg, link, olvasottság.

### 3.2 Kapcsolatok (áttekintés)

```
User (2) ──── Couple ──── Memory, ImportantDate (közös)
User ──< DateIdea (beküldő)      DateIdea >── Partner (opcionális)
User ──< Review >── DateIdea     (userenként ötletenként max. 1)
User ──< Completion >── DateIdea
User ──< BucketList ──< BucketListItem >── DateIdea
User ──< ModerationRequest >── DateIdea
User ──< Notification
Moderátor ──< ModerationAction
```

### 3.3 Láthatósági szabályok (kulcsfontosságú!)

| Adat | Ki látja |
|---|---|
| APPROVED ötlet | mindenki (vendég is) |
| PENDING/REJECTED ötlet | beküldő + moderátorok |
| Értékelés | mindenki |
| Teljesítés ténye + darabszám | mindenki (aggregált) |
| Teljesítés képe | ha `imagePublic`: mindenki; különben csak a pár |
| Teljesítés publikus szövege | mindenki |
| Teljesítés privát szövege | csak a pár két tagja |
| Memory (appon kívüli emlék) | csak a pár két tagja |
| Randinapló | csak a pár két tagja |
| Kuponkód | csak bejelentkezett, aktív felhasználó |

## 4. Funkcionális specifikáció

### 4.1 Ötletböngésző (`/otletek`)
Szűrés: szabadszavas keresés, kategória, helyfüggetlen/helyhez kötött, szezonális. Rendezés: legjobbra értékelt, legtöbbet teljesített, legújabb. Kártyanézet képpel, kategóriacímkével, csillagos átlaggal, teljesítésszámmal, kedvezmény-jelvénnyel.

### 4.2 Ötlet oldala (`/otletek/[id]`)
A jegyzet szerinti teljes tartalom: kép, név, elhelyezkedés vagy „helyfüggetlen", leírás, feltöltő neve, feltöltés ideje, utolsó frissítés, szezonális időszak, teljesítők száma, átlagcsillag. Továbbá:
- **Saját korábbi teljesítések** (kép, szöveg, link a naplóbeli bejegyzésre),
- **publikus teljesítések galériája** (mások publikus képei/írásai),
- **értékelések** listája + saját értékelés leadása/frissítése,
- **„Kipipálom"** űrlap: dátum, kép, kép publikus-e, publikus emlék, privát emlék,
- **bakancslistához adás** legördülővel,
- **moderáció kérése** gomb (szöveges indoklással),
- **partnerkedvezmény doboz** kuponkóddal (bejelentkezve).

### 4.3 Ötletbeküldés (`/otletek/uj`)
Bárki (bejelentkezve) beküldhet ötletet: cím, leírás, kép, kategória, hely/helyfüggetlen, szezon. Állapota `PENDING`; a beküldő látja a sajátjait a profilján állapottal együtt. Elfogadáskor/elutasításkor értesítést kap (elutasításnál a moderátor szöveges indoklásával).

### 4.4 Bakancslisták (`/bakancslistak`)
Gyári listák (pl. „Budapesti klasszikusok", „Természetjáró randik") mindenkinek látszanak. Saját lista: cím + leírás, ötletek hozzáadása/eltávolítása, haladásjelző (a pár teljesítései alapján), lista törlése.

### 4.5 Pár összekapcsolása (`/par`)
Egy felhasználó meghívókódot generál; a másik a kóddal csatlakozik. A pár közös: randinapló, fontos dátumok, bakancslista-haladás (bármelyik fél pipája számít közösnek). Szétkapcsolás lehetséges (a privát tartalmak a létrehozónál maradnak). Az app pár nélkül is teljes értékűen használható (egyéni napló).

### 4.6 Randinapló (`/naplo`)
Idővonal a pár (vagy egyedülálló felhasználó) összes emlékéből: appos teljesítések + appon kívüli emlékek, képpel, publikus és privát szövegekkel. Appon kívüli randi rögzítése: cím, dátum, kép, szöveg. Csak a pár két tagja láthatja.

### 4.7 Fontos dátumok (`/datumok`)
Dátum mentése (pl. megismerkedés napja), év- és hónapforduló-értesítés kapcsolókkal. A rendszer kiszámolja a következő fordulókat; a közelgőkről (14 napon belül) app-on belüli értesítés készül. (Prod: e-mail/push is — l. ütemterv.)

### 4.8 Moderátori felület (`/moderacio`)
- **Beküldött javaslatok**: elfogadás / visszadobás kötelező szöveges üzenettel → a beküldő értesítést kap.
- **Moderációs kérések**: felhasználói jelzések ötletekhez; lezárás válasszal, szükség esetén az ötlet szerkesztése.
- **Ötletek szerkesztése**: bármely ötlet adatai módosíthatók (frissül a `updatedAt`).
- **Felhasználók**: figyelmeztetés szöveges üzenettel (értesítés), felfüggesztés/visszaállítás. Felfüggesztett felhasználó nem tud belépni.
- Minden művelet **audit naplóba** kerül (`ModerationAction`).

### 4.9 Partnerkedvezmények (`/partnerek`)
Partneroldal: partnerek listája, kedvezményeik, kapcsolódó ötletek. Az ötlet oldalán kedvezménydoboz; a kuponkód csak bejelentkezve látszik. Admin kezeli a partnereket. Stratégiai partner: *Három Királyfi, Három Királylány Mozgalom* — kapcsolatok, média, humán erőforrás; közös cél a párkapcsolatok támogatása. További partnerek: erdőjáró körök, múzeumok, nemzeti parkok.

### 4.10 Értesítések (`/ertesitesek`)
App-on belüli értesítési központ: moderációs döntések, figyelmeztetések, párkapcsolódás, közelgő évfordulók. Olvasottnak jelölés; a fejlécben olvasatlan-számláló.

## 5. Nem-funkcionális követelmények

- **Biztonság**: bcrypt jelszóhash; HttpOnly, SameSite=Lax munkamenet-süti (aláírt JWT); szerveroldali jogosultság-ellenőrzés minden mutációnál; Zod séma-validáció minden bemeneten; fájlfeltöltés típus- és méretkorlát (kép, max 5 MB); felfüggesztett fiók kizárása.
- **Adatvédelem**: privát tartalom (privát szöveg, napló, memory) kizárólag a pár két tagjának; a „publikus" kapcsolók alapértelmezése privát. GDPR-megfelelés: adatexport és fióktörlés az ütemtervben.
- **Teljesítmény**: szerveroldali renderelés, indexelt lekérdezések, aggregátumok lekérdezéskor számolva (SQLite mérethez elegendő; skálázásnál materializálható).
- **Hordozhatóság**: SQLite fejlesztéshez/demóhoz, Prisma révén PostgreSQL-re váltás egy connection string csere; fájltár lokálisan, prodban S3-kompatibilis tárra cserélhető (egy modulban izolálva).
- **Minőség**: TypeScript strict, egységtesztek az üzleti logikára (évforduló-számítás, jogosultság, validáció), determinisztikus seed demóadatokkal.

## 6. Technológiai stack és architektúra

| Réteg | Választás | Indoklás |
|---|---|---|
| Keretrendszer | **Next.js 15 (App Router, RSC + Server Actions)** | egy kódbázis, SSR, beépített útvonalkezelés, form-mutációk API-réteg nélkül |
| Nyelv | TypeScript (strict) | típusbiztonság a teljes stacken |
| Adatbázis | SQLite + **Prisma ORM** | zéró-konfigurációs futtatás; sémából migrálható Postgres-re |
| Auth | saját: bcryptjs + jose (JWT süti) | nincs külső függés, teljes kontroll a szerepkörök felett |
| Validáció | Zod | minden server action bemenetén |
| UI | Tailwind CSS | gyors, konzisztens, reszponzív |
| Fájltár | lokális `public/uploads` (izolált modul) | demóhoz elég; prodban S3 adapterre cserélhető |
| Teszt | Vitest | üzleti logika egységtesztjei |

**Elv:** a jogosultsági logika kizárólag szerveroldalon él (`lib/auth.ts` + minden action elején őrfeltétel); a kliens csak megjelenít.

## 7. Ütemterv (a jelen implementáción túli fázisok)

**Fázis 2 — kommunikáció:** e-mail értesítések (moderációs döntés, évforduló), jelszó-visszaállítás, e-mail-megerősítés, web push.
**Fázis 3 — tartalom és felfedezés:** térképnézet (koordináták már a modellben előkészíthetők), címkék a kategóriák mellett, „ötlet a mai napra" ajánló, szezonális főoldali kiemelések, többnyelvűség (EN).
**Fázis 4 — partnerprogram:** partner önkiszolgáló felület, kuponbeváltás-követés (egyedi kódok, statisztika), Három Királyfi mozgalom közös kampányai.
**Fázis 5 — üzemeltetés:** PostgreSQL + S3, CI/CD, monitoring, rate limiting, CDN a képekhez, GDPR-export/törlés, mobilalkalmazás (a szerveroldal REST-re nyitható).

## 8. Nyitott kérdések — döntésekkel

1. **Profilkövetés / social fal?** → **Nem.** A közösségi elem az ötletek oldalán marad (publikus emlékek, értékelések); a termék fókusza a pár, nem a nyilvánosság.
2. **Pár kötelező-e?** → Nem; egyéni használat teljes értékű, a napló ekkor személyes.
3. **Ki pipál a párban?** → Bármelyik tag pipája a pár közös teljesítése (a bakancslista-haladásban közösként számít), de az emlék a rögzítő nevén marad.
4. **Értékelés csak teljesítés után?** → Nem kötelező, de a UI a teljesítőket bátorítja értékelésre; a teljesítők értékelése jelvényt kap (Fázis 3).
