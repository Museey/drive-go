import type { NextConfig } from 'next';

const STAFF_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; " +
  "form-action 'self'; frame-ancestors 'none'; base-uri 'none'";

// DriveGo's own pages (/, /login, /testdrive, /privacy, /articles, /site/…: server/site): their own script and style only, the app's fonts from Google,
// never framed.
const SITE_CSP = "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";

// A shop's page (the legacy screens): they need inline code, onclick attributes, eval and inline styles. What a script
// that got in anyway may reach is narrowed (security review 2026-11-23, docs/SECURITY-AUDIT-2026-11.md ก5): requests only
// to the app itself (and the ProX chain servers named in CHAIN_ORIGINS when the app is built: none yet; the tests' stand-in
// https://chain.drivego.test, a name that never resolves), pictures only from the app or made in the page, the Google
// fonts, nothing loaded from another site.
const CHAIN = ['https://chain.drivego.test', ...(process.env.CHAIN_ORIGINS ?? '').split(/\s+/).filter(o => /^https:\/\/[\w.-]+(:\d+)?$/.test(o))];
const SHOP_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' data: blob:; frame-src 'self' data: blob:; " +
  `worker-src 'self' blob:; connect-src 'self' ${CHAIN.join(' ')}; frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'`;

const config: NextConfig = {
  // The legacy screens load their files by relative path (js/03.js), so a
  // shop's page must keep its trailing slash (/DG-1688/); app/[shop] adds it.
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // Native password hashing: loaded by Node at run time, not bundled.
  serverExternalPackages: ['@node-rs/argon2'],
  // `next dev` would otherwise write server/AGENTS.md; the project's notes
  // for agents are CLAUDE.md and docs/.
  agentRules: false,
  // Security headers on every answer (security review 2026-10-31, docs/SECURITY-REVIEW.md). The legacy screens run
  // inline scripts and onclick attributes, and ProX online calls the chain's own server from the browser, so the
  // Content-Security-Policy forbids being framed by another site, <base>, plugins, forms posting elsewhere and scripts from
  // anywhere but the app (inline code allowed: the legacy screens need it).
  // Pages may frame the app's own pages and attachments (a PDF attachment shows in an iframe, 03.js). Attachments
  // keep their own policy (app/api/files/[id]).
  async headers() {
    const common = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    ];
    return [
      { source: '/:path*', headers: common },
      // script-src: script files only from the app itself, so a <script src> from another site never loads (SECURITY-REVIEW 4;
      // the names and texts a shop types are escaped where they are shown, S286). The legacy screens need inline code,
      // onclick attributes and eval: ten of their files read a window's open document, a top-level `let`, with (0,eval)('Q').
      { source: '/((?!api/files/|ops/|site/|(?:login|testdrive|privacy|articles)$)(?!$).*)', headers: [{ key: 'Content-Security-Policy', value: SHOP_CSP }] },
      // The staff web page (app/ops, server/staff-ui) has no inline code: only its own script and style, never framed.
      { source: '/ops/:path*', headers: [{ key: 'Content-Security-Policy', value: STAFF_CSP }] },
      { source: '/', headers: [{ key: 'Content-Security-Policy', value: SITE_CSP }] },
      { source: '/login', headers: [{ key: 'Content-Security-Policy', value: SITE_CSP }] },
      { source: '/testdrive', headers: [{ key: 'Content-Security-Policy', value: SITE_CSP }] },
      { source: '/privacy', headers: [{ key: 'Content-Security-Policy', value: SITE_CSP }] },
      { source: '/articles', headers: [{ key: 'Content-Security-Policy', value: SITE_CSP }] },
      { source: '/site/:path*', headers: [{ key: 'Content-Security-Policy', value: SITE_CSP }] },
    ];
  },
};

export default config;
