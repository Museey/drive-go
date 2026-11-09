import { NextResponse, type NextRequest } from 'next/server';
import { answer, portalOf } from '@/lib/portal';

// The shops' app and the staff web page are two apps of the same code (lib/portal.ts).
export function proxy(req: NextRequest) {
  const a = answer(portalOf(process.env['DRIVEGO_PORTAL']), req.nextUrl.pathname);
  if (a === 'pass') return NextResponse.next();
  if (a === 'to-staff') {
    // Proxy takes only an absolute address (a relative Location answers 500).
    const to = req.nextUrl.clone();
    to.pathname = '/staff/';
    to.search = '';
    return NextResponse.redirect(to, 302);
  }
  return new Response('not found', { status: 404 });
}

// Not the shop's data and attachments: Next.js copies the body of every request the proxy sees into memory and cuts
// it at 10 MB (proxyClientMaxBodySize), which a whole shop's data or a backup is over. Those paths answer 404 in the
// staff app from lib/api.ts inShop() instead.
export const config = { matcher: ['/((?!api/storage|api/files|_next/).*)'] };
