import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import pkg from '../../../../package.json';

export const dynamic = 'force-dynamic';

/**
 * Életjel-végpont liveness/readiness próbákhoz (Docker healthcheck,
 * Kubernetes probe, UptimeRobot…). Az adatbázist is ellenőrzi.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      db: 'ok',
      version: pkg.version,
      uptimeSeconds: Math.round(process.uptime()),
    });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', db: 'unreachable', error: (e as Error).message },
      { status: 503 }
    );
  }
}
