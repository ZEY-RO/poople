const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { buildSync } = require('esbuild');

// Exercise the same pure renderer used by development and the production build,
// without a browser, local storage, network requests, or generated dist files.
const bundle = buildSync({
  stdin: {
    contents: [
      "export * from './src/seo/render';",
      "export * from './src/seo/content';",
      "export * from './src/seo/routes';",
    ].join('\n'),
    resolveDir: path.resolve('.'), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
}).outputFiles[0].text;
const compiled = new Module(path.join(__dirname, 'seo-bundle.cjs'), module);
compiled.filename = path.join(__dirname, 'seo-bundle.cjs');
compiled.paths = Module._nodeModulePaths(__dirname);
compiled._compile(bundle, compiled.filename);
const { SEO_PAGES, SITE_URL, renderHead, renderPage, renderSitemap,
  getModePath, resolveInitialMode, normalizeLegacyGameUrl } = compiled.exports;

const expectedPaths = ['/', '/unlimited/', '/daily/', '/rush/', '/versus/',
  '/campaign/', '/how-to-play/', '/word-ladder-strategies/'];
const sourceTemplate = readFileSync(path.resolve('index.html'), 'utf8');
// A built Vite document contains stylesheet and modulepreload assets in addition
// to its entry script. Guide documents must keep the former and drop the latter.
const template = sourceTemplate.replace('</head>', [
  '<link rel="stylesheet" crossorigin href="/assets/game.css">',
  '<link rel="modulepreload" crossorigin href="/assets/vendor.js">',
  '<meta name="template-sentinel" content="preserve">',
  '</head>',
].join('\n'));

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)]
    .map(([, key, value]) => [key, decode(value)]));
}
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(match => attributes(match[0]));
}
function schema(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, 'exactly one structured-data document');
  return JSON.parse(scripts[0][1]);
}

test('every indexable destination has unique metadata and a normalized static path', () => {
  assert.deepEqual(SEO_PAGES.map(page => page.path).sort(), [...expectedPaths].sort());
  for (const key of ['path', 'title', 'description']) {
    assert.equal(new Set(SEO_PAGES.map(page => page[key])).size, 8, `unique ${key}`);
    assert.ok(SEO_PAGES.every(page => page[key].trim().length > 0));
  }
  assert.ok(SEO_PAGES.every(page => page.path.startsWith('/') && page.path.endsWith('/')));
});

test('canonical, social, and structured-data URLs describe the current static page', () => {
  for (const page of SEO_PAGES) {
    const head = renderHead(page);
    const canonical = tags(head, 'link').filter(link => link.rel === 'canonical');
    const meta = tags(head, 'meta');
    const url = SITE_URL + page.path;
    assert.deepEqual(canonical.map(link => link.href), [url]);
    assert.equal(meta.find(tag => tag.property === 'og:url').content, url);
    assert.equal(meta.find(tag => tag.property === 'og:title').content, page.title);
    assert.equal(meta.find(tag => tag.name === 'description').content, page.description);
    assert.equal(meta.find(tag => tag.property === 'og:description').content, page.description);
    assert.equal(meta.find(tag => tag.name === 'twitter:description').content, page.description);
    const data = schema(head);
    assert.equal(data['@context'], 'https://schema.org');
    assert.equal(data['@graph'].find(node => node['@type'] === 'WebPage').url, url);
    assert.ok(!JSON.stringify(data).match(/aggregateRating|ratingValue|ratingCount|FAQPage/), 'no unsupported ratings or FAQ rich-result claims');
    const application = data['@graph'].find(node => node['@type'] === 'WebApplication');
    assert.equal(Boolean(application), Boolean(page.mode));
    if (application) {
      assert.equal(application.isAccessibleForFree, true);
      assert.equal(application.offers.price, '0');
    }
  }
});

test('structured-data text safely survives HTML-sensitive characters without changing meaning', () => {
  const page = { ...SEO_PAGES[0], description: 'Words <and> ladders </script><script>alert("test")</script>' };
  const html = renderHead(page);
  const data = schema(html);
  assert.equal(data['@graph'].find(node => node['@type'] === 'WebPage').description, page.description);
  assert.equal([...html.matchAll(/<script\b/g)].length, 1);
});

test('all pages expose a single H1, visible content, and crawlable internal destinations', () => {
  const knownPaths = new Set(expectedPaths);
  for (const page of SEO_PAGES) {
    const html = renderPage(template, page);
    const body = html.slice(html.indexOf('<body'));
    assert.equal([...body.matchAll(/<h1\b/g)].length, 1, `${page.path} has one static H1`);
    assert.equal([...body.matchAll(/id="main-content"/g)].length, 1, 'skip link target exists once');
    assert.ok(body.includes(page.intro[0]), `${page.path} exposes its introduction without JavaScript`);
    const links = tags(body, 'a');
    const internal = links.filter(link => link.href?.startsWith('/') || link.href?.startsWith('#'));
    assert.ok(internal.some(link => link.href === '/how-to-play/'));
    assert.ok(internal.some(link => link.href === '/unlimited/'));
    for (const link of internal) {
      if (link.href.startsWith('#')) assert.ok(body.includes(`id="${link.href.slice(1)}"`));
      else assert.ok(knownPaths.has(link.href), `reachable content link: ${link.href}`);
    }
  }
});

test('static guides retain stylesheet assets while removing game scripts and module preloads', () => {
  for (const page of SEO_PAGES) {
    const html = renderPage(template, page);
    assert.ok(tags(html, 'link').some(tag => tag.rel === 'stylesheet' && tag.href === '/assets/game.css'));
    const gameScripts = tags(html, 'script').filter(script => script.type === 'module');
    const preloads = tags(html, 'link').filter(link => link.rel === 'modulepreload');
    assert.equal(gameScripts.length > 0, Boolean(page.mode), page.path);
    assert.equal(preloads.length > 0, Boolean(page.mode), page.path);
  }
});

test('rendering replaces only marked regions and remains stable when repeated', () => {
  for (const page of SEO_PAGES) {
    const html = renderPage(template, page);
    assert.equal(renderPage(html, page), html, `${page.path} renderer is idempotent`);
    assert.ok(html.includes('<meta name="template-sentinel" content="preserve">'));
    assert.ok(html.includes('name="viewport" content="width=device-width, initial-scale=1.0"'));
  }
  const home = renderPage(template, SEO_PAGES[0]);
  const daily = SEO_PAGES.find(page => page.path === '/daily/');
  assert.equal(renderPage(home, daily), renderPage(template, daily), 'old page metadata/content is replaced, not accumulated');
  assert.throws(() => renderPage('<html></html>', SEO_PAGES[0]), /Missing SEO template region/);
});

test('sitemap lists exactly the canonical static URLs without duplicate query pages or invented dates', () => {
  const sitemap = renderSitemap();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls.sort(), expectedPaths.map(path => SITE_URL + path).sort());
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every(url => !url.includes('?')));
  assert.ok(!sitemap.includes('<lastmod>'));
});

test('named modes resolve from routes and legacy bookmarks without changing custom puzzle links', () => {
  for (const mode of ['daily', 'unlimited', 'rush', 'versus', 'campaign']) {
    const pathname = getModePath(mode);
    assert.equal(resolveInitialMode({ pathname, search: '' }), mode);
    assert.equal(resolveInitialMode({ pathname: pathname.slice(0, -1), search: '' }), mode);
    assert.equal(resolveInitialMode({ pathname: `${pathname}index.html`, search: '' }), mode);
    assert.equal(resolveInitialMode({ pathname: '/', search: `?mode=${mode}` }), mode);
    assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}${pathname}` }), null);
    assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}${pathname}index.html?utm_source=friend#game-guide` }),
      `${pathname}?utm_source=friend#game-guide`, 'direct document aliases load the matching canonical mode');
  }
  assert.equal(resolveInitialMode({ pathname: '/', search: '?mode=toString' }), 'daily');
  assert.equal(resolveInitialMode({ pathname: '/rush/', search: '?mode=unlimited' }), 'unlimited');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/?mode=daily&date=2026-10-01&utm_source=friend#game` }),
    '/daily/?date=2026-10-01&utm_source=friend#game');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/?mode=unlimited&utm_source=friend` }), '/unlimited/?utm_source=friend');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/rush` }), '/rush/');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/index.html` }), '/');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/index.html?start=LOOP&target=POOP` }), '/?start=LOOP&target=POOP');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/how-to-play/?mode=rush` }), null, 'guide content does not redirect into game');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/how-to-play/index.html` }), null, 'guide document aliases need no game routing');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/?start=LOOP&target=POOP` }), null, 'valid shared puzzle is already canonicalized to the game root');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/daily/?start=loop&target=poop&mode=daily&date=2026-10-01&utm_source=friend#game` }),
    '/?start=LOOP&target=POOP&utm_source=friend#game', 'valid custom pair wins over named mode and keeps attribution');
  assert.equal(normalizeLegacyGameUrl({ href: `${SITE_URL}/?start=XXXX&target=POOP&mode=unlimited` }),
    '/unlimited/?start=XXXX&target=POOP', 'invalid custom words cannot suppress a legacy mode route');
});
