import 'server-only';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from './constants';

/**
 * Képfeltöltés lokális tárba (public/uploads).
 * Prodban ez a modul cserélhető S3-kompatibilis adapterre — a hívók csak
 * a visszaadott elérési utat tárolják.
 *
 * @returns a tárolt kép webes útvonala, null ha nem érkezett fájl
 * @throws Error ha a fájl típusa vagy mérete nem megengedett
 */
export async function saveUpload(file: unknown): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Csak képet (JPEG, PNG, WebP, GIF) lehet feltölteni.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('A kép mérete legfeljebb 5 MB lehet.');
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const name = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
