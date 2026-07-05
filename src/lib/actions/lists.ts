'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { failTo, okTo, str } from './helpers';

export async function createList(formData: FormData) {
  const user = await requireUser();
  const title = str(formData, 'title');
  const description = str(formData, 'description') || null;
  if (title.length < 3) failTo('/bakancslistak', 'A lista neve legalább 3 karakter legyen.');

  const list = await db.bucketList.create({
    data: { title, description, ownerId: user.id },
  });
  revalidatePath('/bakancslistak');
  okTo(`/bakancslistak/${list.id}`, 'A bakancslista létrejött — kezdd el feltölteni ötletekkel!');
}

export async function deleteList(formData: FormData) {
  const user = await requireUser();
  const id = str(formData, 'id');
  const list = await db.bucketList.findUnique({ where: { id } });
  if (!list || list.isSystem || list.ownerId !== user.id) {
    failTo('/bakancslistak', 'Ez a lista nem törölhető.');
  }
  await db.bucketList.delete({ where: { id } });
  revalidatePath('/bakancslistak');
  okTo('/bakancslistak', 'A lista törölve.');
}

export async function addToList(formData: FormData) {
  const user = await requireUser();
  const listId = str(formData, 'listId');
  const ideaId = str(formData, 'ideaId');
  const back = `/otletek/${ideaId}`;

  const list = await db.bucketList.findUnique({ where: { id: listId }, include: { items: true } });
  if (!list || list.isSystem || list.ownerId !== user.id) failTo(back, 'A lista nem található.');
  const idea = await db.dateIdea.findUnique({ where: { id: ideaId } });
  if (!idea || idea.status !== 'APPROVED') failTo(back, 'Az ötlet nem található.');
  if (list.items.some((i) => i.ideaId === ideaId)) {
    failTo(back, 'Ez az ötlet már rajta van a listán.');
  }

  await db.bucketListItem.create({
    data: { listId, ideaId, order: list.items.length },
  });
  revalidatePath(`/bakancslistak/${listId}`);
  okTo(back, `Hozzáadva ehhez: „${list.title}".`);
}

export async function removeFromList(formData: FormData) {
  const user = await requireUser();
  const itemId = str(formData, 'itemId');
  const item = await db.bucketListItem.findUnique({ where: { id: itemId }, include: { list: true } });
  if (!item || item.list.isSystem || item.list.ownerId !== user.id) {
    failTo('/bakancslistak', 'Nem távolítható el.');
  }
  await db.bucketListItem.delete({ where: { id: itemId } });
  revalidatePath(`/bakancslistak/${item.listId}`);
  okTo(`/bakancslistak/${item.listId}`);
}
