/**
 * Egyszerű, folyamaton belüli rate limiter (fix ablakos).
 * Egy példányos telepítésnél elegendő; több példánynál / prodban
 * Redis-alapú megoldásra cserélendő (a hívási felület változatlan maradhat).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): { allowed: boolean; remaining: number } {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count++;
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}

/** Tesztekhez és hosszú futású folyamatokhoz: lejárt kulcsok ürítése. */
export function pruneBuckets(now: number = Date.now()) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
