// For the tests only (DRIVEGO_TEST_SERVER=1, tests/support/new-system-setup.mjs): a request the server fails on,
// to see that it is recorded with the session's shop (server/instrumentation.ts, S261). Not found anywhere else.
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.DRIVEGO_TEST_SERVER !== '1') return new Response(null, { status: 404 });
  throw new Error('a request the server failed on (test)');
}
