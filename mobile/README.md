# L’mur — mobil alkalmazás (iOS + Android)

Natív mobilkliens a L’mur REST API-jához, **Expo (React Native)** alapon — egy kódbázisból
fut iPhone-on és Androidon.

## Képernyők

- **Ötletek** — böngészés, keresés, kategória-szűrők
- **Ötlet részletei** — leírás, értékelések, publikus teljesítések, kuponkód, *kipipálás fotóval*
  (publikus/privát emlékszöveggel), értékelés csillagokkal, bakancslistára tétel
- **Listák** — gyári + saját bakancslisták a pár közös haladásával, új lista létrehozása
- **Naplónk** — a pár privát idővonala, appon kívüli emlék rögzítése
- **Értesítések** — olvasatlan-jelöléssel
- **Profil** — belépés/regisztráció, pár-összekapcsolás meghívókóddal, statisztikák

A token natívan az **expo-secure-store**-ban (weben localStorage-ban) tárolódik.

## Fejlesztői futtatás

```bash
cd mobile
npm install

# A szerver alap-URL-je (a telefonról elérhető cím kell, NEM localhost!):
EXPO_PUBLIC_API_URL="http://<géped-LAN-IP-je>:3000" npx expo start
```

Ezután az **Expo Go** appal (App Store / Play Áruház) olvasd be a QR-kódot — vagy `i` / `a`
billentyűvel indíts iOS-szimulátort / Android-emulátort.

A backend indítása a repó gyökerében: `npm run setup && npm run dev`.

## Áruházi kiadás (App Store + Play Áruház)

Az [EAS Build](https://docs.expo.dev/build/introduction/) felhős buildet készít mindkét
platformra (macOS nélkül is):

```bash
npm i -g eas-cli
eas login
eas build --platform ios       # App Store-hoz (.ipa)
eas build --platform android   # Play Áruházhoz (.aab)
eas submit                     # feltöltés az áruházakba
```

Az azonosítók be vannak állítva: `hu.lmur.app` (iOS bundle id + Android package).
Élesben az `EXPO_PUBLIC_API_URL`-t a publikus szerver címére állítsd (EAS build profilban).
