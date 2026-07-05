#!/bin/sh
set -e

# Séma szinkronizálása (SQLite-nál a kötetben lévő fájlra; Postgresnél a megadott DB-re).
npx prisma db push --skip-generate

# Demó-adatok betöltése, ha kérik (első indításhoz / demókörnyezethez).
if [ "$SEED_DEMO" = "1" ]; then
  npx tsx prisma/seed.ts
fi

exec npx next start -p "${PORT:-3000}"
