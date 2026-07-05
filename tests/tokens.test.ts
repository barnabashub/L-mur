import { describe, expect, it } from 'vitest';
import { generateToken, hashToken, isTokenValid, TOKEN_TTL_MS } from '@/lib/token-utils';

describe('generateToken / hashToken', () => {
  it('64 hexadecimális karakter, hívásonként egyedi', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it('a hash determinisztikus és nem egyezik a nyers tokennel', () => {
    const t = generateToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toBe(t);
  });
});

describe('isTokenValid', () => {
  const now = new Date('2026-07-05T12:00:00');
  const future = new Date(now.getTime() + 1000);
  const past = new Date(now.getTime() - 1000);

  it('érvényes: jó típus, nem használt, nem járt le', () => {
    expect(isTokenValid({ type: 'PASSWORD_RESET', expiresAt: future, usedAt: null }, 'PASSWORD_RESET', now)).toBe(true);
  });

  it('hiányzó sor érvénytelen', () => {
    expect(isTokenValid(null, 'PASSWORD_RESET', now)).toBe(false);
  });

  it('rossz típus érvénytelen — a reset token nem használható megerősítésre', () => {
    expect(isTokenValid({ type: 'PASSWORD_RESET', expiresAt: future, usedAt: null }, 'EMAIL_VERIFY', now)).toBe(false);
  });

  it('felhasznált token érvénytelen', () => {
    expect(isTokenValid({ type: 'EMAIL_VERIFY', expiresAt: future, usedAt: past }, 'EMAIL_VERIFY', now)).toBe(false);
  });

  it('lejárt token érvénytelen', () => {
    expect(isTokenValid({ type: 'EMAIL_VERIFY', expiresAt: past, usedAt: null }, 'EMAIL_VERIFY', now)).toBe(false);
  });

  it('a TTL-ek észszerűek: a reset rövidebb, mint a megerősítés', () => {
    expect(TOKEN_TTL_MS.PASSWORD_RESET).toBeLessThan(TOKEN_TTL_MS.EMAIL_VERIFY);
  });
});
