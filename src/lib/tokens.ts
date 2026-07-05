import 'server-only';
import { db } from './db';
import {
  generateToken,
  hashToken,
  isTokenValid,
  TOKEN_TTL_MS,
  type TokenType,
} from './token-utils';

/** Új token kiállítása; a nyers tokent adja vissza (ez megy az e-mailbe). */
export async function issueToken(userId: string, type: TokenType): Promise<string> {
  // A korábbi, még fel nem használt tokenek érvénytelenítése.
  await db.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
  const token = generateToken();
  await db.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]),
    },
  });
  return token;
}

/** Token beváltása: érvényesség-ellenőrzés + egyszer használatosság. */
export async function consumeToken(token: string, type: TokenType) {
  const row = await db.authToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!isTokenValid(row, type)) return null;
  await db.authToken.update({ where: { id: row!.id }, data: { usedAt: new Date() } });
  return row!;
}
