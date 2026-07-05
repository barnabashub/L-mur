import 'server-only';
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';

/**
 * REST API (v1) autentikáció a mobil/natív kliensekhez.
 * A webes munkamenet-sütitől függetlenül Bearer tokent használ,
 * ugyanazzal a titokkal, de külön 'api' audience-szel.
 */

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'fejlesztesi-titok-csereld-le-prodban'
);
const AUDIENCE = 'kettesben-api';
const TOKEN_DAYS = 30;

export async function createApiToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_DAYS}d`)
    .sign(secret);
}

/** Bearer tokenből az aktív felhasználó — vagy null. */
export async function getApiUser(req: Request) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), secret, { audience: AUDIENCE });
    if (typeof payload.sub !== 'string') return null;
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: { couple: { include: { members: { select: { id: true, name: true } } } } },
    });
    if (!user || user.status !== 'ACTIVE') return null;
    return user;
  } catch {
    return null;
  }
}

export type ApiUser = NonNullable<Awaited<ReturnType<typeof getApiUser>>>;

export function apiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function apiOk(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

/** A felhasználó és párja azonosítói — a privát tartalmak köre. */
export function apiCoupleIds(user: ApiUser): string[] {
  return user.couple ? user.couple.members.map((m) => m.id) : [user.id];
}
