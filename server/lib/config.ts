import { join, resolve } from 'node:path';

// The legacy screens split into files in Phase 1 (repository folder frontend/).
// Read at run time; the ignore comment keeps the bundler from tracing (and
// copying) the whole repository because of the dynamic path.
export const FRONTEND_DIR = resolve(/*turbopackIgnore: true*/ process.env.FRONTEND_DIR ?? join(process.cwd(), '..', 'frontend'));

// A shop's address is /<shop code>/ (owner decision Q1), e.g. /DG-1688/.
export const SHOP_CODE = /^[A-Za-z0-9][A-Za-z0-9-]{1,31}$/;
