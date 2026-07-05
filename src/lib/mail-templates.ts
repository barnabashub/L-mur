/** Magyar nyelvű e-mail sablonok — tiszta függvények. */

type Mail = { subject: string; text: string };

const signature = '\n\nSzeretettel,\na Kettesben csapata 💛';

export function verifyEmailMail(name: string, link: string): Mail {
  return {
    subject: 'Erősítsd meg az e-mail címedet — Kettesben',
    text: `Szia ${name}!\n\nÜdvözlünk a Kettesben-ben! Kérjük, erősítsd meg az e-mail címedet az alábbi linkre kattintva (a link 24 óráig érvényes):\n\n${link}\n\nHa nem te regisztráltál, hagyd figyelmen kívül ezt a levelet.${signature}`,
  };
}

export function passwordResetMail(name: string, link: string): Mail {
  return {
    subject: 'Jelszó-visszaállítás — Kettesben',
    text: `Szia ${name}!\n\nJelszó-visszaállítást kértél. Új jelszót az alábbi linken adhatsz meg (a link 1 óráig érvényes, és csak egyszer használható):\n\n${link}\n\nHa nem te kérted, nincs teendőd — a jelszavad változatlan.${signature}`,
  };
}

export function ideaApprovedMail(name: string, ideaTitle: string, link: string): Mail {
  return {
    subject: `Elfogadtuk az ötletedet: „${ideaTitle}"`,
    text: `Szia ${name}!\n\nÖrömhír: a moderátoraink elfogadták a(z) „${ideaTitle}" ötletedet, mostantól minden pár láthatja!\n\n${link}${signature}`,
  };
}

export function ideaRejectedMail(name: string, ideaTitle: string, reason: string): Mail {
  return {
    subject: `Az ötletedet most nem fogadtuk el: „${ideaTitle}"`,
    text: `Szia ${name}!\n\nA(z) „${ideaTitle}" ötletedet a moderátoraink most nem fogadták el.\n\nIndoklás: ${reason}\n\nNe csüggedj — javítva bármikor újra beküldheted!${signature}`,
  };
}

export function warningMail(name: string, message: string): Mail {
  return {
    subject: 'Moderátori figyelmeztetés — Kettesben',
    text: `Szia ${name}!\n\nModerátori figyelmeztetést kaptál:\n\n${message}\n\nKérjük, tartsd be a közösségi irányelveinket.${signature}`,
  };
}

export function suspendedMail(name: string, message: string): Mail {
  return {
    subject: 'A fiókodat felfüggesztettük — Kettesben',
    text: `Szia ${name}!\n\nA fiókodat felfüggesztettük.\n\nIndoklás: ${message}\n\nHa úgy gondolod, tévedés történt, válaszolj erre a levélre.${signature}`,
  };
}

export function coupleJoinedMail(name: string, partnerName: string, link: string): Mail {
  return {
    subject: `${partnerName} összekapcsolódott veled — Kettesben`,
    text: `Szia ${name}!\n\n${partnerName} beváltotta a meghívókódodat — mostantól közös a randinaplótok, a fontos dátumaitok és a bakancslista-haladásotok!\n\n${link}${signature}`,
  };
}

export function anniversaryMail(
  name: string,
  title: string,
  count: number,
  kind: 'yearly' | 'monthly',
  dateText: string,
  daysAway: number,
  link: string
): Mail {
  const kindText = kind === 'yearly' ? 'évforduló' : 'hónapforduló';
  const when = daysAway === 0 ? 'MA van' : `${daysAway} nap múlva (${dateText}) lesz`;
  return {
    subject: `Közeleg egy ${kindText}: ${title} 🎉`,
    text: `Szia ${name}!\n\nCsak szólunk: ${when} a(z) „${title}" ${count}. ${kindText}ja!\n\nTaláljatok ki valami szépet kettesben — az ötletgyűjteményünk tele van inspirációval:\n${link}${signature}`,
  };
}
