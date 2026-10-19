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
};

export default config;
