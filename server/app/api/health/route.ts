import { pool } from '@/lib/db';
import { portalOf } from '@/lib/portal';
import { staffPool } from '@/lib/staff';

export const dynamic = 'force-dynamic';

// The staff web page's own app reaches the database as drivego_staff (it has no DATABASE_URL).
export async function GET() {
  try {
    await (portalOf(process.env['DRIVEGO_PORTAL']) === 'staff' ? staffPool() : pool()).query('select 1');
    return Response.json({ ok: true, db: true });
  } catch {
    return Response.json({ ok: false, db: false }, { status: 503 });
  }
}
