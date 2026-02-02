import { NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

/**
 * Health check for production (load balancers, monitoring).
 * GET /api/health returns 200 when app is up; optional ?db=1 checks database.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkDb = searchParams.get('db') === '1';

  if (!checkDb) {
    return NextResponse.json({ ok: true, status: 'up' });
  }

  try {
    const connected = await dbAdapter.testConnection();
    return NextResponse.json({
      ok: connected,
      status: connected ? 'up' : 'degraded',
      database: connected ? 'connected' : 'unavailable',
    });
  } catch {
    return NextResponse.json(
      { ok: false, status: 'degraded', database: 'error' },
      { status: 503 }
    );
  }
}
