/**
 * Token-segédek tiszta (adatbázis-független) része — egységtesztelve.
 * A nyers token csak az e-mailben utazik; az adatbázisban kizárólag a hash-e él.
 */
import crypto from 'crypto';

export const TOKEN_TYPES = ['PASSWORD_RESET', 'EMAIL_VERIFY'] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

export const TOKEN_TTL_MS: Record<TokenType, number> = {
  PASSWORD_RESET: 60 * 60 * 1000, // 1 óra
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24 óra
};

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isTokenValid(
  row: { type: string; expiresAt: Date; usedAt: Date | null } | null,
  expectedType: TokenType,
  now: Date = new Date()
): boolean {
  if (!row) return false;
  if (row.type !== expectedType) return false;
  if (row.usedAt) return false;
  return row.expiresAt.getTime() > now.getTime();
}
