import type { NextConfig } from 'next';

const config: NextConfig = {
  // The legacy screens load their files by relative path (js/03.js), so a
  // shop's page must keep its trailing slash (/DG-1688/); app/[shop] adds it.
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
};

export default config;
