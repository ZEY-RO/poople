import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

// Check the deployable artifacts, including Vite's rewritten asset references.
// A renderer unit test alone cannot catch a missing page in the Pages upload.
const directory = resolve('dist');
const sitemap = await readFile(resolve(directory, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
assert.equal(urls.length, 8, 'all eight canonical destinations must be built');
assert.equal(new Set(urls.map(url => url.href)).size, urls.length);
const paths = new Set(urls.map(url => url.pathname));
const titles = new Set();
for (const url of urls) {
  assert.equal(url.origin, 'https://poople.site');
  assert.equal(url.search, '');
  const html = await readFile(resolve(directory, `.${url.pathname}`, 'index.html'), 'utf8');
  assert.ok(html.includes(`rel="canonical" href="${url.href}"`), `${url.href}: self canonical`);
  assert.ok(html.includes(`property="og:url" content="${url.href}"`), `${url.href}: social URL`);
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
  if (url.pathname === '/how-to-play/' || url.pathname === '/word-ladder-strategies/') {
    assert.ok(!html.includes('type="module"'), `${url.href}: static guide without game JavaScript`);
    assert.ok(!html.includes('modulepreload'), `${url.href}: no game preload`);
  } else assert.ok(html.includes('type="module"'), `${url.href}: playable game entry`);
  const destinations = [...html.matchAll(/<a\b[^>]*href="(\/[^"?#]*)"/g)].map(match => match[1]);
  for (const destination of destinations) assert.ok(paths.has(destination), `${url.href}: known internal link ${destination}`);
}
assert.equal(titles.size, urls.length, 'unique page titles');
const robots = await readFile(resolve(directory, 'robots.txt'), 'utf8');
assert.ok(robots.includes('Sitemap: https://poople.site/sitemap.xml'));
assert.ok(!/Disallow:\s*\//.test(robots));
console.log(`SEO artifact check passed: ${urls.length} static pages, canonical URLs, structured data, internal links, and local assets.`);
