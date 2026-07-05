'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { isModerator } from '@/lib/permissions';
import { saveUpload } from '@/lib/uploads';
import { CATEGORIES } from '@/lib/constants';
import { bool, failTo, okTo, str } from './helpers';

const ideaSchema = z.object({
  title: z.string().min(3, 'A cím legalább 3 karakter legyen.').max(120),
  description: z.string().min(20, 'A leírás legalább 20 karakter legyen.').max(5000),
  category: z.enum(CATEGORIES, { message: 'Válassz kategóriát.' }),
  locationName: z.string().max(160).optional(),
  isLocationIndependent: z.boolean(),
  isSeasonal: z.boolean(),
  seasonLabel: z.string().max(120).optional(),
});

export async function submitIdea(formData: FormData) {
  const user = await requireUser();
  const parsed = ideaSchema.safeParse({
    title: str(formData, 'title'),
    description: str(formData, 'description'),
    category: str(formData, 'category'),
    locationName: str(formData, 'locationName') || undefined,
    isLocationIndependent: bool(formData, 'isLocationIndependent'),
    isSeasonal: bool(formData, 'isSeasonal'),
    seasonLabel: str(formData, 'seasonLabel') || undefined,
  });
  if (!parsed.success) failTo('/otletek/uj', parsed.error.issues[0].message);
  const data = parsed.data;
  if (!data.isLocationIndependent && !data.locationName) {
    failTo('/otletek/uj', 'Add meg a helyszínt, vagy jelöld helyfüggetlennek.');
  }

  let imagePath: string | null = null;
  try {
    imagePath = await saveUpload(formData.get('image'));
  } catch (e) {
    failTo('/otletek/uj', (e as Error).message);
  }

  // Moderátor közvetlenül publikál, felhasználó javaslata moderációra vár.
  const autoApprove = isModerator(user.role);
  const idea = await db.dateIdea.create({
    data: {
      ...data,
      locationName: data.isLocationIndependent ? null : data.locationName,
      seasonLabel: data.isSeasonal ? data.seasonLabel : null,
      imagePath,
      submitterId: user.id,
      status: autoApprove ? 'APPROVED' : 'PENDING',
    },
  });

  if (!autoApprove) {
    const mods = await db.user.findMany({
      where: { role: { in: ['MODERATOR', 'ADMIN'] } },
      select: { id: true },
    });
    await db.notification.createMany({
      data: mods.map((m) => ({
        userId: m.id,
        type: 'MODERATION',
        message: `Új ötletjavaslat érkezett: „${idea.title}"`,
        link: '/moderacio',
      })),
    });
  }

  revalidatePath('/', 'layout');
  okTo(
    autoApprove ? `/otletek/${idea.id}` : '/profil',
    autoApprove ? 'Az ötlet publikálva.' : 'Köszönjük! A javaslatodat a moderátorok hamarosan átnézik.'
  );
}

export async function reviewIdea(formData: FormData) {
  const user = await requireUser();
  const ideaId = str(formData, 'ideaId');
  const stars = Number(str(formData, 'stars'));
  const text = str(formData, 'text') || null;
  const back = `/otletek/${ideaId}`;

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) failTo(back, 'Válassz 1–5 csillagot.');
  const idea = await db.dateIdea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== 'APPROVED') failTo('/otletek', 'Az ötlet nem található.');

  await db.review.upsert({
    where: { ideaId_userId: { ideaId, userId: user.id } },
    create: { ideaId, userId: user.id, stars, text },
    update: { stars, text },
  });
  revalidatePath(back);
  okTo(back, 'Köszönjük az értékelést!');
}

export async function completeIdea(formData: FormData) {
  const user = await requireUser();
  const ideaId = str(formData, 'ideaId');
  const back = `/otletek/${ideaId}`;

  const idea = await db.dateIdea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== 'APPROVED') failTo('/otletek', 'Az ötlet nem található.');

  const dateStr = str(formData, 'date');
  const date = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(date.getTime())) failTo(back, 'Érvénytelen dátum.');

  let imagePath: string | null = null;
  try {
    imagePath = await saveUpload(formData.get('image'));
  } catch (e) {
    failTo(back, (e as Error).message);
  }

  await db.completion.create({
    data: {
      ideaId,
      userId: user.id,
      date,
      imagePath,
      imagePublic: bool(formData, 'imagePublic'),
      publicText: str(formData, 'publicText') || null,
      privateText: str(formData, 'privateText') || null,
    },
  });
  revalidatePath('/', 'layout');
  okTo(back, 'Gratulálunk, kipipálva! Az emlék bekerült a naplótokba. 💛');
}

export async function deleteCompletion(formData: FormData) {
  const user = await requireUser();
  const id = str(formData, 'id');
  const completion = await db.completion.findUnique({ where: { id } });
  if (!completion || completion.userId !== user.id) failTo('/naplo', 'Nem törölhető.');
  await db.completion.delete({ where: { id } });
  revalidatePath('/', 'layout');
  okTo('/naplo', 'Az emlék törölve.');
}

export async function requestModeration(formData: FormData) {
  const user = await requireUser();
  const ideaId = str(formData, 'ideaId');
  const message = str(formData, 'message');
  const back = `/otletek/${ideaId}`;
  if (message.length < 5) failTo(back, 'Írd le pár szóban, mit kellene javítani.');

  const idea = await db.dateIdea.findUnique({ where: { id: ideaId } });
  if (!idea) failTo('/otletek', 'Az ötlet nem található.');

  await db.moderationRequest.create({ data: { ideaId, userId: user.id, message } });
  const mods = await db.user.findMany({
    where: { role: { in: ['MODERATOR', 'ADMIN'] } },
    select: { id: true },
  });
  await db.notification.createMany({
    data: mods.map((m) => ({
      userId: m.id,
      type: 'MODERATION',
      message: `Moderációs kérés érkezett: „${idea.title}"`,
      link: '/moderacio?nezet=keresek',
    })),
  });
  okTo(back, 'Köszönjük a jelzést, a moderátorok megnézik.');
}
