import { describe, expect, it } from 'vitest';
import { pruneBuckets, rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('az ablakon belül a limitig enged, felette tilt', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit('k1', 5, 60_000, t0 + i).allowed).toBe(true);
    }
    expect(rateLimit('k1', 5, 60_000, t0 + 10).allowed).toBe(false);
  });

  it('az ablak lejárta után újraindul', () => {
    const t0 = 2_000_000;
    for (let i = 0; i < 6; i++) rateLimit('k2', 5, 60_000, t0);
    expect(rateLimit('k2', 5, 60_000, t0 + 60_001).allowed).toBe(true);
  });

  it('kulcsok függetlenek', () => {
    const t0 = 3_000_000;
    for (let i = 0; i < 6; i++) rateLimit('k3', 5, 60_000, t0);
    expect(rateLimit('k4', 5, 60_000, t0).allowed).toBe(true);
  });

  it('pruneBuckets a lejártakat üríti', () => {
    const t0 = 4_000_000;
    rateLimit('k5', 5, 1_000, t0);
    pruneBuckets(t0 + 2_000);
    // ürítés után újra teli keret
    for (let i = 0; i < 5; i++) {
      expect(rateLimit('k5', 5, 1_000, t0 + 3_000).allowed).toBe(true);
    }
  });
});
