// Shared settings for the test harness and the tools that build its fixtures.
// Plain JS so both the TypeScript tests and the Node tools can import it.

// Every test runs at this moment. Dates inside the demo data, document numbers
// (MA-SA2610…) and debt ages are all computed from "today", so it must not move.
export const FIXED_NOW = '2026-10-13T09:00:00+07:00';

// The fixture is built one hour earlier on the same day, so records a test
// creates are always newer than the fixture's (the app orders FIFO lots and
// builds ids from Date.now()).
export const FIXTURE_NOW = '2026-10-13T08:00:00+07:00';

// Math.random is replaced by a seeded generator so record ids (uid()) and
// generated codes come out the same on every run. The fixture tool and the
// tests use different seeds, and every page load in a tab continues with a new
// seed, so ids made during a test never repeat ids already in the fixture.
export const FIXTURE_SEED = 20261013;
export const TEST_SEED = 1013;

export const PORT = Number(process.env.LEGACY_PORT || 4173);
export const LEGACY_ORIGIN = `http://127.0.0.1:${PORT}`;
export const LEGACY_URL = `${LEGACY_ORIGIN}/DRIVEGO_TRIAL_v23.html`;

// Browser context settings shared by tests and fixtures. Timezone matters: the
// app turns "now" into local dates, so the fixture and the tests must agree.
export const CONTEXT_OPTIONS = {
  viewport: { width: 1280, height: 800 },
  locale: 'th-TH',
  timezoneId: 'Asia/Bangkok',
};

// Demo owner account printed on the legacy login screen.
export const OWNER = { user: 'dg1688', pass: '123456' };

// Runs in the page before any app script.
export function seedRandomInitScript(seed) {
  let run = 0;
  try {
    run = Number(sessionStorage.getItem('__seedRun') || 0);
    sessionStorage.setItem('__seedRun', String(run + 1));
  } catch (e) {}
  let s = (seed + run * 0x9e3779b9) >>> 0;
  // mulberry32
  Math.random = function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
