// Which of the two apps a server is (DRIVEGO_PORTAL, read by server/proxy.ts at run time), and what it answers:
//   (unset) the shops' app (.do/app.yaml): the staff web page is not there at all;
//   staff   the staff web page's own app (.do/staff.yaml): nothing of the shops' app is there;
//   both    a local run and the tests (tools/serve-new.mjs).
// Two addresses keep the staff page out of reach of anything that runs in a shop's page (the legacy screens), and the
// shops' app never holds the staff page's database connection (STAFF_DATABASE_URL). The proxy does not see /api/storage and
// /api/files (their bodies are large, proxy.ts); in the staff app they answer 404 from lib/api.ts inShop().
export type Portal = 'shop' | 'staff' | 'both';
export type Answer = 'pass' | 'not-found' | 'to-staff';

export const portalOf = (v: string | undefined): Portal => (v === 'staff' || v === 'both' ? v : 'shop');
const isStaffPath = (p: string) => p === '/staff' || p.startsWith('/staff/') || p === '/api/staff' || p.startsWith('/api/staff/');

export function answer(portal: Portal, path: string): Answer {
  if (portal === 'both') return 'pass';
  if (portal === 'staff') return isStaffPath(path) || path === '/api/health' ? 'pass' : path === '/' ? 'to-staff' : 'not-found';
  return isStaffPath(path) ? 'not-found' : 'pass';
}
