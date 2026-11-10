import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildSync } from 'esbuild';

// Check the deployable artifacts, including Vite's rewritten asset references.
// A renderer unit test alone cannot catch a missing page in the Pages upload.
const directory = resolve('dist');
const compiledContent = buildSync({
  entryPoints: ['src/seo/content.ts'], bundle: true, write: false,
  platform: 'node', format: 'esm',
}).outputFiles[0].text;
const { SEO_PAGES } = await import(`data:text/javascript;base64,${Buffer.from(compiledContent).toString('base64')}`);
const sitemap = await readFile(resolve(directory, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
assert.deepEqual(urls.map(url => url.pathname).sort(), SEO_PAGES.map(page => page.path).sort(), 'every declared destination must be in the deployable sitemap');
assert.equal(new Set(urls.map(url => url.href)).size, urls.length);
const paths = new Set(urls.map(url => url.pathname));
const titles = new Set();
const entries = new Map();
const socialCard = await readFile(resolve(directory, 'social-card.png'));
assert.ok(socialCard.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'social preview must contain actual PNG bytes');
assert.equal(socialCard.readUInt32BE(16), 1200, 'social preview width');
assert.equal(socialCard.readUInt32BE(20), 630, 'social preview height');
for (const url of urls) {
  const page = SEO_PAGES.find(page => page.path === url.pathname);
  assert.equal(url.origin, 'https://poople.site');
  assert.equal(url.search, '');
  const html = await readFile(resolve(directory, `.${url.pathname}`, 'index.html'), 'utf8');
  assert.ok(html.includes(`rel="canonical" href="${url.href}"`), `${url.href}: self canonical`);
  assert.ok(html.includes(`property="og:url" content="${url.href}"`), `${url.href}: social URL`);
  assert.ok(html.includes('property="og:image" content="https://poople.site/social-card.png"'), `${url.href}: current factual preview`);
  assert.ok(html.includes('property="og:image:type" content="image/png"'), `${url.href}: matching image MIME type`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${url.href}: one heading before JavaScript`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert.ok(title, `${url.href}: title`);
  titles.add(title);
  const schema = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(schema, `${url.href}: JSON-LD`);
  JSON.parse(schema);
  assert.ok(!html.includes('aggregateRating'), `${url.href}: no unsupported rating`);
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"#?]+)"/g)].map(match => match[1]);
  assert.ok(assets.some(asset => asset.endsWith('.css')), `${url.href}: production CSS`);
  for (const asset of assets) assert.ok((await stat(resolve(directory, `.${asset}`))).isFile());
  const scripts = [...html.matchAll(/<script\b[^>]*type="module"[^>]*>/g)]
    .map(match => match[0].match(/src="([^"]+)"/)?.[1]).filter(Boolean);
  entries.set(url.pathname, scripts);
  if (!page.mode && !page.tool) {
    assert.ok(!html.includes('type="module"'), `${url.href}: static guide without game JavaScript`);
    assert.ok(!html.includes('modulepreload'), `${url.href}: no game preload`);
  } else {
    assert.equal(scripts.length, 1, `${url.href}: one interactive entry`);
    assert.ok(scripts[0].startsWith('/assets/'), `${url.href}: built JavaScript rather than a source entry`);
    if (page.tool) {
      assert.ok(html.includes('id="solver-root"') && /<form\b/.test(html), `${url.href}: useful form before JavaScript`);
      assert.ok(!html.includes('modulepreload'), `${url.href}: no eager game preloads`);
    }
  }
  const destinations = [...html.matchAll(/<a\b[^>]*href="(\/[^"?#]*)"/g)].map(match => match[1]);
  for (const destination of destinations) assert.ok(paths.has(destination), `${url.href}: known internal link ${destination}`);
}
assert.equal(titles.size, urls.length, 'unique page titles');
assert.ok(paths.has('/word-ladder-solver/'), 'the solver destination must be published');
assert.notDeepEqual(entries.get('/word-ladder-solver/'), entries.get('/'), 'solver and game bootstraps must differ');
// Follow the solver's built imports instead of trusting filenames or a source
// import check; accidental game/service dependencies must not reach this tool.
const solverModules = [...entries.get('/word-ladder-solver/')].map(entry => resolve(directory, `.${entry}`));
const visited = new Set();
let solverJavaScript = '';
while (solverModules.length) {
  const filename = solverModules.pop();
  if (visited.has(filename)) continue;
  visited.add(filename);
  const source = await readFile(filename, 'utf8');
  solverJavaScript += source;
  for (const match of source.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)["'](\.[^"']+\.js)["']/g)) {
    solverModules.push(resolve(dirname(filename), match[1]));
  }
}
assert.ok(!/supabase|poople_global_presence|analytics_visitors|Grandmaster Commode/i.test(solverJavaScript), 'solver bundle must not load the game or optional remote services');
const robots = await readFile(resolve(directory, 'robots.txt'), 'utf8');
assert.ok(robots.includes('Sitemap: https://poople.site/sitemap.xml'));
assert.ok(!/Disallow:\s*\//.test(robots));
console.log(`SEO artifact check passed: ${urls.length} static pages, canonical URLs, social PNG, structured data, internal links, local assets, and isolated solver bundle.`);
