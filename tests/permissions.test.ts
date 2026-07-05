import { describe, expect, it } from 'vitest';
import { canViewIdea, canViewPrivate, isModerator } from '@/lib/permissions';

describe('canViewPrivate', () => {
  const owner = { userId: 'u1', userCoupleId: 'c1' };

  it('vendég nem lát privát tartalmat', () => {
    expect(canViewPrivate(null, owner)).toBe(false);
  });

  it('a tulajdonos látja a sajátját', () => {
    expect(canViewPrivate({ userId: 'u1', userCoupleId: null }, owner)).toBe(true);
  });

  it('a pár másik tagja látja', () => {
    expect(canViewPrivate({ userId: 'u2', userCoupleId: 'c1' }, owner)).toBe(true);
  });

  it('idegen (más párból) nem látja', () => {
    expect(canViewPrivate({ userId: 'u3', userCoupleId: 'c2' }, owner)).toBe(false);
  });

  it('pár nélküli idegen nem látja — a null coupleId nem egyezik', () => {
    expect(
      canViewPrivate({ userId: 'u3', userCoupleId: null }, { userId: 'u1', userCoupleId: null })
    ).toBe(false);
  });
});

describe('canViewIdea', () => {
  it('APPROVED mindenkinek látszik', () => {
    expect(canViewIdea('APPROVED', 'u1', null)).toBe(true);
  });

  it('PENDING vendégnek nem látszik', () => {
    expect(canViewIdea('PENDING', 'u1', null)).toBe(false);
  });

  it('PENDING a beküldőnek látszik', () => {
    expect(canViewIdea('PENDING', 'u1', { id: 'u1', role: 'USER' })).toBe(true);
  });

  it('REJECTED idegen felhasználónak nem látszik', () => {
    expect(canViewIdea('REJECTED', 'u1', { id: 'u2', role: 'USER' })).toBe(false);
  });

  it('PENDING moderátornak látszik', () => {
    expect(canViewIdea('PENDING', 'u1', { id: 'u9', role: 'MODERATOR' })).toBe(true);
  });
});

describe('isModerator', () => {
  it.each([
    ['USER', false],
    ['MODERATOR', true],
    ['ADMIN', true],
  ])('%s → %s', (role, expected) => {
    expect(isModerator(role)).toBe(expected);
  });
});
