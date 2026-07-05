import { describe, expect, it } from 'vitest';
import {
  nextMonthlyAnniversary,
  nextYearlyAnniversary,
  upcomingAnniversaries,
} from '@/lib/dates';

const d = (s: string) => new Date(s + 'T12:00:00');

describe('nextYearlyAnniversary', () => {
  it('az idei dátumot adja, ha még nem múlt el', () => {
    const a = nextYearlyAnniversary(d('2024-09-21'), d('2026-07-05'));
    expect(a.date.getFullYear()).toBe(2026);
    expect(a.date.getMonth()).toBe(8);
    expect(a.date.getDate()).toBe(21);
    expect(a.count).toBe(2);
  });

  it('a jövő évit adja, ha az idei már elmúlt', () => {
    const a = nextYearlyAnniversary(d('2024-03-10'), d('2026-07-05'));
    expect(a.date.getFullYear()).toBe(2027);
    expect(a.count).toBe(3);
  });

  it('a mai nap 0 napra van', () => {
    const a = nextYearlyAnniversary(d('2024-07-05'), d('2026-07-05'));
    expect(a.daysAway).toBe(0);
    expect(a.count).toBe(2);
  });

  it('szökőnapi eredetnél a hónap utolsó napjára esik', () => {
    const a = nextYearlyAnniversary(d('2024-02-29'), d('2026-01-15'));
    expect(a.date.getMonth()).toBe(1);
    expect(a.date.getDate()).toBe(28);
  });
});

describe('nextMonthlyAnniversary', () => {
  it('e havi fordulót adja, ha még nem múlt el', () => {
    const a = nextMonthlyAnniversary(d('2024-09-21'), d('2026-07-05'));
    expect(a.date.getMonth()).toBe(6);
    expect(a.date.getDate()).toBe(21);
    expect(a.count).toBe(22);
  });

  it('jövő havit adja, ha az e havi elmúlt', () => {
    const a = nextMonthlyAnniversary(d('2024-09-02'), d('2026-07-05'));
    expect(a.date.getMonth()).toBe(7);
    expect(a.date.getDate()).toBe(2);
  });

  it('31-ei eredetnél a rövidebb hónap utolsó napjára esik', () => {
    const a = nextMonthlyAnniversary(d('2026-01-31'), d('2026-02-10'));
    expect(a.date.getMonth()).toBe(1);
    expect(a.date.getDate()).toBe(28);
  });
});

describe('upcomingAnniversaries', () => {
  const base = { notifyYearly: true, notifyMonthly: false };

  it('csak az ablakon belüli fordulókat adja, rendezve', () => {
    const out = upcomingAnniversaries(
      [
        { id: 'a', title: 'Távoli', date: d('2024-12-24'), ...base },
        { id: 'b', title: 'Közeli', date: d('2024-07-20'), ...base },
        { id: 'c', title: 'Havi', date: d('2025-01-10'), notifyYearly: false, notifyMonthly: true },
      ],
      d('2026-07-05'),
      45
    );
    expect(out.map((o) => o.id)).toEqual(['c', 'b']);
    expect(out[0].kind).toBe('monthly');
  });

  it('kikapcsolt értesítésnél nem ad semmit', () => {
    const out = upcomingAnniversaries(
      [{ id: 'a', title: 'X', date: d('2024-07-06'), notifyYearly: false, notifyMonthly: false }],
      d('2026-07-05')
    );
    expect(out).toHaveLength(0);
  });
});
