// Rows in groups of at most CHUNK_BYTES of data (or CHUNK_ROWS rows): node-pg turns each array parameter into one text
// literal, so one query with a whole data set's rows built several copies of it at once — a 25 MB save (a shop's three
// years, replaced whole) took 200 MB more memory for its insert alone (found on the 1 GB test server, 2026-11-13).
const CHUNK_BYTES = 2 * 1024 * 1024, CHUNK_ROWS = 2000;
export function chunks<T>(rows: T[], size: (r: T) => number): T[][] {
  const out: T[][] = [];
  let part: T[] = [], bytes = 0;
  for (const r of rows) {
    const n = size(r);
    if (part.length && (bytes + n > CHUNK_BYTES || part.length >= CHUNK_ROWS)) { out.push(part); part = []; bytes = 0; }
    part.push(r); bytes += n;
  }
  if (part.length) out.push(part);
  return out;
}
