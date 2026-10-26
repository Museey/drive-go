// Playwright global setup for TARGET=new: starts the new system once for the
// whole run (tools/serve-new.mjs) and tells the workers where its database is,
// so each test can open its own shop (new-shop.mjs). Stops it at the end.
import { startNewSystem } from '../../tools/serve-new.mjs';
import { FIXED_NOW } from './config.mjs';

export default async function setup() {
  if ((process.env.TARGET || 'legacy') !== 'new') return;
  // The server counts licences (task 3.15) on the day the browsers' clock is fixed at, not the real one:
  // the fixtures' licences would otherwise run out one day and every test shop turn read-only.
  process.env.DRIVEGO_TODAY = FIXED_NOW.slice(0, 10);
  process.env.DRIVEGO_TEST_SERVER = '1';
  const sys = await startNewSystem({ build: !process.env.NO_BUILD, quiet: true });
  process.env.DRIVEGO_OWNER_DB = sys.ownerUrl;
  return () => sys.stop();
}
