// Downloads the Google Fonts used by the legacy HTML into tests/support/fonts/
// so tests render the same glyphs offline and screenshots stay stable.
// Run once (npm run fonts); the result is committed.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = readFileSync(new URL('../legacy/DRIVEGO_TRIAL_v23.html', import.meta.url), 'utf8');
const outDir = new URL('../tests/support/fonts/', import.meta.url);
mkdirSync(outDir, { recursive: true });

// Chrome user agent so Google serves woff2, same as what the test browser asks for.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const name = url => createHash('sha1').update(url).digest('hex').slice(0, 16);

const cssUrls = [...new Set([...html.matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/g)].map(m => m[0].replace(/&amp;/g, '&')))];
const manifest = {};
for (const cssUrl of cssUrls) {
  const css = await (await fetch(cssUrl, { headers: { 'user-agent': UA } })).text();
  const cssFile = name(cssUrl) + '.css';
  writeFileSync(new URL(cssFile, outDir), css);
  manifest[cssUrl] = { file: cssFile, type: 'text/css' };
  for (const [, fontUrl] of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) {
    if (manifest[fontUrl]) continue;
    const buf = Buffer.from(await (await fetch(fontUrl)).arrayBuffer());
    const file = name(fontUrl) + '.woff2';
    writeFileSync(new URL(file, outDir), buf);
    manifest[fontUrl] = { file, type: 'font/woff2' };
  }
}
writeFileSync(new URL('manifest.json', outDir), JSON.stringify(manifest, null, 1) + '\n');
console.log(`saved ${Object.keys(manifest).length} files for ${cssUrls.length} stylesheets`);
