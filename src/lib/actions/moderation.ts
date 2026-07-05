'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin, requireModerator } from '@/lib/auth';
import { CATEGORIES } from '@/lib/constants';
import { normalizeTags, parseMonths } from '@/lib/discover';
import { saveUpload } from '@/lib/uploads';
import { appUrl, sendMail } from '@/lib/mail';
import {
  ideaApprovedMail,
  ideaRejectedMail,
  suspendedMail,
  warningMail,
} from '@/lib/mail-templates';
import { bool, failTo, okTo, str } from './helpers';

const MOD = '/moderacio';

async function logAction(data: {
  type: string;
  moderatorId: string;
  targetUserId?: string;
  ideaId?: string;
  message?: string | null;
}) {
  await db.moderationAction.create({ data });
}

export async function approveIdea(formData: FormData) {
  const mod = await requireModerator();
  const id = str(formData, 'id');
  const idea = await db.dateIdea.findUnique({ where: { id }, include: { submitter: true } });
  if (!idea || idea.status !== 'PENDING') failTo(MOD, 'A javaslat nem található.');

  await db.dateIdea.update({ where: { id }, data: { status: 'APPROVED', rejectionNote: null } });
  await logAction({ type: 'APPROVE', moderatorId: mod.id, ideaId: id });
  await db.notification.create({
    data: {
      userId: idea.submitterId,
      type: 'IDEA',
      message: `Elfogadtuk az ötletedet: „${idea.title}" — köszönjük! 🎉`,
      link: `/otletek/${id}`,
    },
  });
  await sendMail({
    to: idea.submitter.email,
    ...ideaApprovedMail(idea.submitter.name, idea.title, appUrl(`/otletek/${id}`)),
  });
  revalidatePath('/', 'layout');
  okTo(MOD, 'Az ötlet elfogadva és publikálva.');
}

export async function rejectIdea(formData: FormData) {
  const mod = await requireModerator();
  const id = str(formData, 'id');
  const message = str(formData, 'message');
  if (message.length < 5) failTo(MOD, 'Az elutasításhoz kötelező indoklást írni.');

  const idea = await db.dateIdea.findUnique({ where: { id }, include: { submitter: true } });
  if (!idea || idea.status !== 'PENDING') failTo(MOD, 'A javaslat nem található.');

  await db.dateIdea.update({ where: { id }, data: { status: 'REJECTED', rejectionNote: message } });
  await logAction({ type: 'REJECT', moderatorId: mod.id, ideaId: id, message });
  await db.notification.create({
    data: {
      userId: idea.submitterId,
      type: 'IDEA',
      message: `Az ötletedet („${idea.title}") most nem fogadtuk el. Indoklás: ${message}`,
      link: '/profil',
    },
  });
  await sendMail({
    to: idea.submitter.email,
    ...ideaRejectedMail(idea.submitter.name, idea.title, message),
  });
  revalidatePath('/', 'layout');
  okTo(MOD, 'A javaslat visszadobva, a beküldő értesítést kapott.');
}

const editSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(5000),
  category: z.enum(CATEGORIES),
  locationName: z.string().max(160).optional(),
  isLocationIndependent: z.boolean(),
  isSeasonal: z.boolean(),
  seasonLabel: z.string().max(120).optional(),
  partnerId: z.string().optional(),
});

export async function editIdea(formData: FormData) {
  const mod = await requireModerator();
  const id = str(formData, 'id');
  const back = `/moderacio/otlet/${id}`;

  const parsed = editSchema.safeParse({
    title: str(formData, 'title'),
    description: str(formData, 'description'),
    category: str(formData, 'category'),
    locationName: str(formData, 'locationName') || undefined,
    isLocationIndependent: bool(formData, 'isLocationIndependent'),
    isSeasonal: bool(formData, 'isSeasonal'),
    seasonLabel: str(formData, 'seasonLabel') || undefined,
    partnerId: str(formData, 'partnerId') || undefined,
  });
  if (!parsed.success) failTo(back, 'Érvénytelen adatok: ' + parsed.error.issues[0].message);
  const data = parsed.data;

  const idea = await db.dateIdea.findUnique({ where: { id } });
  if (!idea) failTo(MOD, 'Az ötlet nem található.');

  let imagePath = idea.imagePath;
  try {
    imagePath = (await saveUpload(formData.get('image'))) ?? imagePath;
  } catch (e) {
    failTo(back, (e as Error).message);
  }

  const latRaw = str(formData, 'lat');
  const lngRaw = str(formData, 'lng');
  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;
  if ((lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) ||
      (lng !== null && (isNaN(lng) || lng < -180 || lng > 180))) {
    failTo(back, 'Érvénytelen koordináták.');
  }
  const months = parseMonths(str(formData, 'seasonMonths'));

  await db.dateIdea.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      isLocationIndependent: data.isLocationIndependent,
      locationName: data.isLocationIndependent ? null : data.locationName ?? null,
      isSeasonal: data.isSeasonal,
      seasonLabel: data.isSeasonal ? data.seasonLabel ?? null : null,
      seasonMonths: data.isSeasonal && months.length ? months.join(',') : null,
      tags: normalizeTags(str(formData, 'tags')),
      lat: data.isLocationIndependent ? null : lat,
      lng: data.isLocationIndependent ? null : lng,
      partnerId: data.partnerId || null,
      imagePath,
    },
  });
  await logAction({ type: 'EDIT', moderatorId: mod.id, ideaId: id });
  revalidatePath('/', 'layout');
  okTo(`/otletek/${id}`, 'Az ötlet frissítve.');
}

export async function resolveRequest(formData: FormData) {
  const mod = await requireModerator();
  const id = str(formData, 'id');
  const resolution = str(formData, 'resolution');
  const back = `${MOD}?nezet=keresek`;
  if (resolution.length < 2) failTo(back, 'Írj választ a kérés lezárásához.');

  const request = await db.moderationRequest.findUnique({
    where: { id },
    include: { idea: true },
  });
  if (!request || request.status !== 'OPEN') failTo(back, 'A kérés nem található.');

  await db.moderationRequest.update({
    where: { id },
    data: { status: 'RESOLVED', resolution },
  });
  await logAction({
    type: 'RESOLVE_REQUEST',
    moderatorId: mod.id,
    ideaId: request.ideaId,
    targetUserId: request.userId,
    message: resolution,
  });
  await db.notification.create({
    data: {
      userId: request.userId,
      type: 'MODERATION',
      message: `A(z) „${request.idea.title}" ötlethez küldött jelzésedet lezártuk: ${resolution}`,
      link: `/otletek/${request.ideaId}`,
    },
  });
  revalidatePath(MOD);
  okTo(back, 'A kérés lezárva.');
}

/** Moderátor csak sima felhasználóra hathat; admin moderátorra is, de adminra és önmagára nem. */
async function guardTarget(actorRole: string, actorId: string, targetId: string) {
  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) return null;
  if (target.id === actorId) return null;
  if (target.role === 'ADMIN') return null;
  if (target.role === 'MODERATOR' && actorRole !== 'ADMIN') return null;
  return target;
}

export async function warnUser(formData: FormData) {
  const mod = await requireModerator();
  const userId = str(formData, 'userId');
  const message = str(formData, 'message');
  const back = `${MOD}?nezet=felhasznalok`;
  if (message.length < 5) failTo(back, 'A figyelmeztetéshez kötelező üzenetet írni.');

  const target = await guardTarget(mod.role, mod.id, userId);
  if (!target) failTo(back, 'Ez a felhasználó nem figyelmeztethető.');

  await logAction({ type: 'WARN', moderatorId: mod.id, targetUserId: userId, message });
  await db.notification.create({
    data: {
      userId,
      type: 'WARNING',
      message: `Moderátori figyelmeztetést kaptál: ${message}`,
    },
  });
  await sendMail({ to: target.email, ...warningMail(target.name, message) });
  okTo(back, `${target.name} figyelmeztetve.`);
}

export async function suspendUser(formData: FormData) {
  const mod = await requireModerator();
  const userId = str(formData, 'userId');
  const message = str(formData, 'message') || 'A közösségi szabályok megsértése.';
  const back = `${MOD}?nezet=felhasznalok`;

  const target = await guardTarget(mod.role, mod.id, userId);
  if (!target || target.status === 'SUSPENDED') failTo(back, 'Ez a felhasználó nem függeszthető fel.');

  await db.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });
  await logAction({ type: 'SUSPEND', moderatorId: mod.id, targetUserId: userId, message });
  await sendMail({ to: target.email, ...suspendedMail(target.name, message) });
  revalidatePath(MOD);
  okTo(back, `${target.name} felfüggesztve.`);
}

export async function unsuspendUser(formData: FormData) {
  const mod = await requireModerator();
  const userId = str(formData, 'userId');
  const back = `${MOD}?nezet=felhasznalok`;

  const target = await guardTarget(mod.role, mod.id, userId);
  if (!target || target.status !== 'SUSPENDED') failTo(back, 'Ez a felhasználó nem állítható vissza.');

  await db.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
  await logAction({ type: 'UNSUSPEND', moderatorId: mod.id, targetUserId: userId });
  revalidatePath(MOD);
  okTo(back, `${target.name} fiókja újra aktív.`);
}

export async function toggleModerator(formData: FormData) {
  const admin = await requireAdmin();
  const userId = str(formData, 'userId');
  const back = `${MOD}?nezet=felhasznalok`;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.id === admin.id || target.role === 'ADMIN') {
    failTo(back, 'Ez a művelet nem végezhető el.');
  }
  const newRole = target.role === 'MODERATOR' ? 'USER' : 'MODERATOR';
  await db.user.update({ where: { id: userId }, data: { role: newRole } });
  revalidatePath(MOD);
  okTo(back, newRole === 'MODERATOR' ? `${target.name} mostantól moderátor.` : `${target.name} moderátori joga visszavonva.`);
}

export async function createPartner(formData: FormData) {
  await requireAdmin();
  const name = str(formData, 'name');
  const discountText = str(formData, 'discountText');
  const couponCode = str(formData, 'couponCode');
  if (name.length < 2 || discountText.length < 2 || couponCode.length < 2) {
    failTo('/partnerek', 'Add meg a partner nevét, a kedvezményt és a kuponkódot.');
  }
  await db.partner.create({
    data: {
      name,
      discountText,
      couponCode,
      description: str(formData, 'description') || null,
      website: str(formData, 'website') || null,
    },
  });
  revalidatePath('/partnerek');
  okTo('/partnerek', 'A partner rögzítve.');
}
