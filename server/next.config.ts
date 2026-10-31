import type { NextConfig } from 'next';

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
  // Content-Security-Policy only forbids being framed by another site, <base>, plugins and forms posting elsewhere.
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
      { source: '/((?!api/files/).*)', headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" }] },
    ];
  },
};

export default config;
