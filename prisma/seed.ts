/**
 * Determinisztikus demó-adatok a Kettesben alkalmazáshoz.
 * Futtatás: npm run db:seed  (a `npm run setup` is meghívja)
 *
 * Demó fiókok (jelszó mindenhol: titok123!):
 *   admin@kettesben.hu  — admin
 *   mod@kettesben.hu    — moderátor
 *   anna@example.com    — felhasználó (Bencével párban)
 *   bence@example.com   — felhasználó (Annával párban)
 *   kata@example.com    — felhasználó (pár nélkül)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  // Idempotens seed: mindent újraépítünk.
  await db.$transaction([
    db.notification.deleteMany(),
    db.moderationAction.deleteMany(),
    db.moderationRequest.deleteMany(),
    db.bucketListItem.deleteMany(),
    db.bucketList.deleteMany(),
    db.review.deleteMany(),
    db.completion.deleteMany(),
    db.memory.deleteMany(),
    db.importantDate.deleteMany(),
    db.dateIdea.deleteMany(),
    db.partner.deleteMany(),
    db.user.deleteMany(),
    db.couple.deleteMany(),
  ]);

  const hash = await bcrypt.hash('titok123!', 10);

  const couple = await db.couple.create({ data: { inviteCode: 'ANNABE' } });
  const [admin, mod, anna, bence, kata] = await Promise.all([
    db.user.create({ data: { email: 'admin@kettesben.hu', name: 'Kettesben Admin', passwordHash: hash, role: 'ADMIN' } }),
    db.user.create({ data: { email: 'mod@kettesben.hu', name: 'Moderátor Márta', passwordHash: hash, role: 'MODERATOR' } }),
    db.user.create({ data: { email: 'anna@example.com', name: 'Kiss Anna', passwordHash: hash, coupleId: couple.id } }),
    db.user.create({ data: { email: 'bence@example.com', name: 'Nagy Bence', passwordHash: hash, coupleId: couple.id } }),
    db.user.create({ data: { email: 'kata@example.com', name: 'Szabó Kata', passwordHash: hash } }),
  ]);

  const [haromKiralyfi, budaVar, bukkiNP, kavezo] = await Promise.all([
    db.partner.create({
      data: {
        name: 'Három Királyfi, Három Királylány Mozgalom',
        description: 'Stratégiai partnerünk — közös célunk a párkapcsolatok és a családok támogatása. Programjaikhoz a Kettesben közösség elérést biztosít.',
        website: 'https://haromkiralyfi.hu',
        discountText: '10% kedvezmény a mozgalom páros programjaira',
        couponCode: 'KIRALYPAR10',
      },
    }),
    db.partner.create({
      data: {
        name: 'Budavári Sikló és Vár',
        description: 'A budai Vár programjai és a Sikló.',
        discountText: '15% a páros belépőjegy árából',
        couponCode: 'VARBAN15',
      },
    }),
    db.partner.create({
      data: {
        name: 'Bükki Nemzeti Park',
        description: 'Vezetett túrák és látogatóközpontok a Bükkben.',
        website: 'https://www.bnpi.hu',
        discountText: '2 az 1-ben belépő a vezetett túrákra',
        couponCode: 'BUKK2X1',
      },
    }),
    db.partner.create({
      data: {
        name: 'Zamat Kávézó',
        description: 'Hangulatos belvárosi kávézó, társasjáték-polccal.',
        discountText: 'Ajándék sütemény két kávé mellé',
        couponCode: 'ZAMATDUO',
      },
    }),
  ]);

  const mkIdea = (data: {
    title: string;
    description: string;
    category: string;
    locationName?: string;
    isLocationIndependent?: boolean;
    isSeasonal?: boolean;
    seasonLabel?: string;
    partnerId?: string;
    submitterId?: string;
    status?: string;
  }) =>
    db.dateIdea.create({
      data: {
        status: 'APPROVED',
        submitterId: mod.id,
        isLocationIndependent: false,
        ...data,
      },
    });

  const ideas = {
    halaszbastya: await mkIdea({
      title: 'Naplemente a Halászbástyáról',
      description:
        'Sétáljatok fel naplemente előtt fél órával a Halászbástyához, és nézzétek végig kettesben, ahogy a Duna fölött lemegy a nap. Utána egy forró csoki a közeli cukrászdában teszi teljessé az estét. Tipp: hétköznap sokkal kevesebb a turista.',
      category: 'Romantikus',
      locationName: 'Budapest, Halászbástya',
      partnerId: budaVar.id,
    }),
    bukk: await mkIdea({
      title: 'Vezetett túra a Bükk fennsíkján',
      description:
        'Egész napos, közepesen nehéz túra a Bükki Nemzeti Park szakvezetőjével. Kilátópontok, víznyelők, és ha szerencsétek van, muflonok. Vigyetek réteges ruhát és sok vizet — a fennsíkon hűvösebb van.',
      category: 'Természet',
      locationName: 'Bükki Nemzeti Park',
      isSeasonal: true,
      seasonLabel: 'áprilistól októberig',
      partnerId: bukkiNP.id,
    }),
    tarsas: await mkIdea({
      title: 'Társasjáték-est kettesben',
      description:
        'Válasszatok egy kétszemélyes társasjátékot (Patchwork, 7 Csoda Párbaj, Fesztáv…), készítsetek nassolnivalót, és kapcsoljátok ki a telefonokat. A vesztes mosogat egy hétig!',
      category: 'Otthoni',
      isLocationIndependent: true,
    }),
    kavezoJatek: await mkIdea({
      title: 'Kávé + társasjáték a Zamatban',
      description:
        'A Zamat Kávézó polcán több tucat társasjáték vár. Kérjetek két cappuccinót, és játsszatok egy jót — a törzsvendégek szerint a sarki fotelsarok a legjobb hely.',
      category: 'Gasztronómia',
      locationName: 'Budapest, Zamat Kávézó',
      partnerId: kavezo.id,
    }),
    margitsziget: await mkIdea({
      title: 'Piknik a Margitszigeten',
      description:
        'Kockás pléd, friss pékáru, sajt, gyümölcs és egy jó lemez a hordozható hangszórón. A Margitsziget nagyrétje tökéletes piknikhely, utána a szökőkút zenés show-ja ingyenes ráadás.',
      category: 'Romantikus',
      locationName: 'Budapest, Margitsziget',
      isSeasonal: true,
      seasonLabel: 'májustól szeptemberig',
    }),
    fozes: await mkIdea({
      title: 'Főzzétek meg együtt az első közös receptet',
      description:
        'Válasszatok egy olyan ételt, amit még egyikőtök sem készített soha. A közös bevásárlás is a randi része! A végén pontozzátok az eredményt, és vezessetek "közös szakácskönyvet" a sikerekről.',
      category: 'Otthoni',
      isLocationIndependent: true,
    }),
    szepmuveszeti: await mkIdea({
      title: 'Egy kép — két történet a Szépművészetiben',
      description:
        'Válasszatok a múzeumban külön-külön egy-egy festményt, majd meséljétek el egymásnak, miért pont azt. Meglepő, mennyit elárul a másikról. A hónap első vasárnapján több kiállítás kedvezményes.',
      category: 'Kultúra',
      locationName: 'Budapest, Szépművészeti Múzeum',
    }),
    csillagles: await mkIdea({
      title: 'Csillagles a fényszennyezéstől távol',
      description:
        'Augusztusi hullócsillag-esőkor keressetek egy sötét dombtetőt (a Zselici Csillagpark a legjobb), vigyetek plédet, termoszban teát, és számoljátok a hullócsillagokat. Kívánni kötelező!',
      category: 'Kaland',
      locationName: 'Zselici Csillagoségbolt-park',
      isSeasonal: true,
      seasonLabel: 'augusztus közepe (Perseidák)',
    }),
    tanc: await mkIdea({
      title: 'Páros táncóra kezdőknek',
      description:
        'Egy próbaóra bachatából vagy rock and rollból — kétballábasoknak is! A közös nevetés garantált, és végre lesz mit bemutatni a következő lagziban.',
      category: 'Aktív / sport',
      isLocationIndependent: true,
    }),
    termalfurdo: await mkIdea({
      title: 'Téli esti fürdőzés a Széchenyiben',
      description:
        'Gőzölgő kültéri medence, csillagos téli ég, sakkozó bácsik — a Széchenyi fürdő esti fényekkel az egyik legromantikusabb téli program Budapesten.',
      category: 'Romantikus',
      locationName: 'Budapest, Széchenyi Gyógyfürdő',
      isSeasonal: true,
      seasonLabel: 'novembertől februárig a leghangulatosabb',
    }),
    levelek: await mkIdea({
      title: 'Írjatok levelet a 10 évvel későbbi magatoknak',
      description:
        'Egy csendes este, két boríték, két toll. Írjátok meg, hol tartotok most, és mit kívántok a 10 évvel későbbi pár-magatoknak. Zárjátok le, és rejtsétek el — felbontani csak együtt szabad!',
      category: 'Otthoni',
      isLocationIndependent: true,
    }),
    adventiVasar: await mkIdea({
      title: 'Forralt bor az adventi vásárban',
      description:
        'Kézműves vásár, forralt bor, kürtőskalács és fényfüzérek. Válasszatok egymásnak egy-egy apró kézműves ajándékot — maximum 2000 forintból!',
      category: 'Esemény',
      locationName: 'Budapest, Vörösmarty tér',
      isSeasonal: true,
      seasonLabel: 'adventi időszak',
    }),
    biciklitura: await mkIdea({
      title: 'Balaton-parti biciklitúra fagyizással',
      description:
        'Béreljetek bringát és tekerjetek végig a déli parton Balatonföldvártól Szemesig. Útközben kötelező megálló minimum két fagyizónál — pontozzátok őket közösen!',
      category: 'Aktív / sport',
      locationName: 'Balaton déli part',
      isSeasonal: true,
      seasonLabel: 'júniustól szeptemberig',
    }),
    hajnal: await mkIdea({
      title: 'Hajnali napfelkelte-vadászat',
      description:
        'Egyszer az életben keljetek fel hajnali négykor, menjetek ki egy kilátóhoz, és nézzétek végig együtt a napfelkeltét termoszos kakaóval. Utána jár a nagy közös reggeli!',
      category: 'Kaland',
      isLocationIndependent: true,
    }),
  };

  // Anna beküldött javaslata — moderációra vár.
  const pendingIdea = await db.dateIdea.create({
    data: {
      title: 'Kutyás menhelylátogatás és sétáltatás',
      description:
        'Sok menhely fogad önkéntes sétáltatókat hétvégén. Egy közös jócselekedet, ami után napokig jó kedvetek lesz — és talán egy új családtagot is találtok.',
      category: 'Természet',
      locationName: 'bármelyik közeli menhely',
      submitterId: anna.id,
      status: 'PENDING',
    },
  });
  await db.notification.create({
    data: {
      userId: mod.id,
      type: 'MODERATION',
      message: `Új ötletjavaslat érkezett: „${pendingIdea.title}"`,
      link: '/moderacio',
    },
  });

  // Gyári bakancslisták.
  const mkList = (title: string, description: string, ideaIds: string[]) =>
    db.bucketList.create({
      data: {
        title,
        description,
        isSystem: true,
        items: { create: ideaIds.map((ideaId, order) => ({ ideaId, order })) },
      },
    });
  await Promise.all([
    mkList('Budapesti klasszikusok', 'Amit minden budapesti (és odalátogató) párnak ki kell pipálnia.', [
      ideas.halaszbastya.id,
      ideas.margitsziget.id,
      ideas.szepmuveszeti.id,
      ideas.termalfurdo.id,
      ideas.adventiVasar.id,
    ]),
    mkList('Természetjáró párok listája', 'Friss levegő, kilátók és csillagok — a szabadban vagytok igazán kettesben.', [
      ideas.bukk.id,
      ideas.csillagles.id,
      ideas.biciklitura.id,
      ideas.hajnal.id,
    ]),
    mkList('Esős napokra', 'Helyfüggetlen ötletek, amikhez csak ti kelletek.', [
      ideas.tarsas.id,
      ideas.fozes.id,
      ideas.levelek.id,
      ideas.tanc.id,
    ]),
  ]);

  // Anna és Bence saját listája + haladás.
  await db.bucketList.create({
    data: {
      title: 'Nagy terveink 2026-ra',
      description: 'Amit idén mindenképp meg akarunk csinálni.',
      ownerId: anna.id,
      items: {
        create: [
          { ideaId: ideas.csillagles.id, order: 0 },
          { ideaId: ideas.biciklitura.id, order: 1 },
          { ideaId: ideas.termalfurdo.id, order: 2 },
        ],
      },
    },
  });

  // Teljesítések (pipák) — publikus és privát emlékekkel.
  await db.completion.createMany({
    data: [
      {
        ideaId: ideas.halaszbastya.id,
        userId: anna.id,
        date: new Date('2026-03-14'),
        imagePublic: false,
        publicText: 'Hétköznap este szinte üres volt, csodás naplementét kaptunk!',
        privateText: 'Itt mondta ki Bence először, hogy szeret. 💛',
      },
      {
        ideaId: ideas.termalfurdo.id,
        userId: bence.id,
        date: new Date('2026-01-24'),
        imagePublic: false,
        publicText: 'A gőzölgő vízből nézni a havazást — felejthetetlen.',
      },
      {
        ideaId: ideas.tarsas.id,
        userId: anna.id,
        date: new Date('2026-02-07'),
        imagePublic: false,
        privateText: 'Bence háromszor nyert Patchworkben, azóta is emlegeti…',
      },
      {
        ideaId: ideas.halaszbastya.id,
        userId: kata.id,
        date: new Date('2026-05-01'),
        imagePublic: false,
        publicText: 'Egyedül is gyönyörű, de legközelebb már nem egyedül jövök. :)',
      },
    ],
  });

  // Appon kívüli emlék a naplóba.
  await db.memory.create({
    data: {
      userId: bence.id,
      title: 'Első közös nyaralásunk — Prága',
      date: new Date('2025-08-19'),
      text: 'Nem az appból jött, de a Károly hídon sétálni éjfélkor életünk egyik legjobb randija volt.',
    },
  });

  // Értékelések.
  await db.review.createMany({
    data: [
      { ideaId: ideas.halaszbastya.id, userId: anna.id, stars: 5, text: 'Kihagyhatatlan klasszikus, hétköznap este a legjobb.' },
      { ideaId: ideas.halaszbastya.id, userId: kata.id, stars: 4, text: 'Gyönyörű, de hétvégén nagyon zsúfolt.' },
      { ideaId: ideas.termalfurdo.id, userId: bence.id, stars: 5, text: 'Téli estén verhetetlen program.' },
      { ideaId: ideas.tarsas.id, userId: anna.id, stars: 4, text: 'Olcsó, egyszerű, mégis az egyik legjobb esténk volt.' },
      { ideaId: ideas.bukk.id, userId: kata.id, stars: 5, text: 'A szakvezetés rengeteget hozzátett, a kupon is működött!' },
    ],
  });

  // Fontos dátumok Annáéknak.
  await db.importantDate.createMany({
    data: [
      { userId: anna.id, title: 'Megismerkedésünk napja', date: new Date('2024-09-21'), notifyYearly: true, notifyMonthly: true },
      { userId: bence.id, title: 'Első randink', date: new Date('2024-10-05'), notifyYearly: true, notifyMonthly: false },
    ],
  });

  // Nyitott moderációs kérés Katától.
  await db.moderationRequest.create({
    data: {
      ideaId: ideas.adventiVasar.id,
      userId: kata.id,
      message: 'A vásár idén a Városháza parkba költözött, érdemes frissíteni a helyszínt.',
    },
  });

  console.log('✔ Seed kész. Demó fiókok (jelszó: titok123!):');
  console.log('  admin@kettesben.hu / mod@kettesben.hu / anna@example.com / bence@example.com / kata@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
