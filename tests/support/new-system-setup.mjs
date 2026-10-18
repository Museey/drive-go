// Playwright global setup for TARGET=new: starts the new system once for the
// whole run (tools/serve-new.mjs) and tells the workers where its database is,
// so each test can open its own shop (new-shop.mjs). Stops it at the end.
import { startNewSystem } from '../../tools/serve-new.mjs';

export default async function setup() {
  if ((process.env.TARGET || 'legacy') !== 'new') return;
  const sys = await startNewSystem({ build: !process.env.NO_BUILD, quiet: true });
  process.env.DRIVEGO_OWNER_DB = sys.ownerUrl;
  return () => sys.stop();
}
