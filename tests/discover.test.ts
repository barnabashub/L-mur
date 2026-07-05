import { describe, expect, it } from 'vitest';
import { isInSeason, normalizeTags, parseMonths, parseTags, pickOfTheDay } from '@/lib/discover';

describe('pickOfTheDay', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  it('ugyanazon a napon determinisztikus', () => {
    const d1 = new Date('2026-07-05T08:00:00');
    const d2 = new Date('2026-07-05T22:30:00');
    expect(pickOfTheDay(items, d1)).toBe(pickOfTheDay(items, d2));
  });

  it('különböző napokon (általában) mást ad — 30 napon belül vált', () => {
    const picks = new Set<string>();
    for (let day = 1; day <= 30; day++) {
      picks.add(pickOfTheDay(items, new Date(2026, 6, day))!);
    }
    expect(picks.size).toBeGreaterThan(1);
  });

  it('üres listára null', () => {
    expect(pickOfTheDay([], new Date())).toBeNull();
  });
});

describe('parseMonths / isInSeason', () => {
  it('parseMonths: érvénytelen elemek kiszűrve', () => {
    expect(parseMonths(' 5, 6 ,x,13,0,7')).toEqual([5, 6, 7]);
    expect(parseMonths(null)).toEqual([]);
  });

  it('isInSeason: hónapmegadás nélkül mindig aktuális', () => {
    expect(isInSeason(null, new Date('2026-07-05'))).toBe(true);
    expect(isInSeason('', new Date('2026-01-01'))).toBe(true);
  });

  it('isInSeason: csak a felsorolt hónapokban', () => {
    expect(isInSeason('6,7,8', new Date('2026-07-05'))).toBe(true);
    expect(isInSeason('11,12,1,2', new Date('2026-07-05'))).toBe(false);
    expect(isInSeason('11,12,1,2', new Date('2026-01-15'))).toBe(true);
  });
});

describe('parseTags / normalizeTags', () => {
  it('normalizál: kisbetű, trim, dedupe, üresek ki', () => {
    expect(parseTags(' Ingyenes,  kutyabarát ,ingyenes,,')).toEqual(['ingyenes', 'kutyabarát']);
  });

  it('normalizeTags: tárolási alak, üresre null', () => {
    expect(normalizeTags(' Túra, Olcsó ')).toBe('túra, olcsó');
    expect(normalizeTags('  ,  ')).toBeNull();
  });
});
