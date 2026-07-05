'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { saveUpload } from '@/lib/uploads';
import { failTo, okTo, str } from './helpers';

export async function addMemory(formData: FormData) {
  const user = await requireUser();
  const title = str(formData, 'title');
  const dateStr = str(formData, 'date');
  const text = str(formData, 'text') || null;
  if (title.length < 2) failTo('/naplo', 'Adj címet az emléknek.');
  const date = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(date.getTime())) failTo('/naplo', 'Érvénytelen dátum.');

  let imagePath: string | null = null;
  try {
    imagePath = await saveUpload(formData.get('image'));
  } catch (e) {
    failTo('/naplo', (e as Error).message);
  }

  await db.memory.create({ data: { userId: user.id, title, date, text, imagePath } });
  revalidatePath('/naplo');
  okTo('/naplo', 'Az emlék bekerült a naplótokba.');
}

export async function deleteMemory(formData: FormData) {
  const user = await requireUser();
  const id = str(formData, 'id');
  const memory = await db.memory.findUnique({ where: { id } });
  if (!memory || memory.userId !== user.id) failTo('/naplo', 'Nem törölhető.');
  await db.memory.delete({ where: { id } });
  revalidatePath('/naplo');
  okTo('/naplo', 'Az emlék törölve.');
}

export async function addImportantDate(formData: FormData) {
  const user = await requireUser();
  const title = str(formData, 'title');
  const dateStr = str(formData, 'date');
  if (title.length < 2) failTo('/datumok', 'Adj nevet a dátumnak.');
  const date = new Date(dateStr);
  if (!dateStr || isNaN(date.getTime())) failTo('/datumok', 'Érvénytelen dátum.');

  await db.importantDate.create({
    data: {
      userId: user.id,
      title,
      date,
      notifyYearly: formData.get('notifyYearly') === 'on',
      notifyMonthly: formData.get('notifyMonthly') === 'on',
    },
  });
  revalidatePath('/datumok');
  okTo('/datumok', 'A fontos dátum elmentve.');
}

export async function deleteImportantDate(formData: FormData) {
  const user = await requireUser();
  const id = str(formData, 'id');
  const d = await db.importantDate.findUnique({ where: { id }, include: { user: true } });
  // A pár mindkét tagja kezelheti a közös dátumokat.
  const sameCouple = d && user.coupleId !== null && d.user.coupleId === user.coupleId;
  if (!d || (d.userId !== user.id && !sameCouple)) failTo('/datumok', 'Nem törölhető.');
  await db.importantDate.delete({ where: { id } });
  revalidatePath('/datumok');
  okTo('/datumok', 'A dátum törölve.');
}
