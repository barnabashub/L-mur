import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS a REST API-hoz (/api/v1/*): a natív mobilappoknak nem kell,
 * de az Expo webes futtatásához és külső integrációkhoz igen.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }
  const res = NextResponse.next();
  for (const [key, value] of Object.entries(CORS_HEADERS)) res.headers.set(key, value);
  return res;
}

export const config = { matcher: '/api/v1/:path*' };
