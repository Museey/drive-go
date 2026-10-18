// Minimal static server for the tests: legacy/ at / (the original HTML) and
// frontend/ at /frontend/ (the split version from Phase 1), on one origin so
// datasets restore the same way for both.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORT } from '../tests/support/config.mjs';

const roots = [
  ['/frontend/', fileURLToPath(new URL('../frontend/', import.meta.url))],
  ['/', fileURLToPath(new URL('../legacy/', import.meta.url))],
];
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png',
};

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const [prefix, root] = roots.find(([pre]) => path.startsWith(pre));
  try {
    const body = await readFile(join(root, path.slice(prefix.length)));
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`legacy served on http://127.0.0.1:${PORT}/`));
