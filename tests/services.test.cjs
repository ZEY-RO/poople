const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { buildSync } = require('esbuild');

// A development bundle with deliberately unusable remote credentials proves that
// testing local games cannot open sockets or send analytics to a hosted project.
const bundle = buildSync({
  stdin: {
    contents: "export { analytics, isSupabaseConfigured } from './src/services/analytics'; export { isRealtimeConfigured } from './src/services/liveCounter';",
    resolveDir: path.resolve('.'), loader: 'ts'
  },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  define: { 'import.meta.env': JSON.stringify({ DEV: true, VITE_SUPABASE_URL: 'https://example.invalid', VITE_SUPABASE_ANON_KEY: 'development-test' }) }
}).outputFiles[0].text;
let fetches = 0;
global.fetch = async () => { fetches++; throw new Error('No network allowed'); };
global.window = Object.assign(new EventTarget(), {
  location: { search: '', pathname: '/', hostname: 'localhost' },
  screen: { width: 1280, height: 800 }, innerWidth: 1280, innerHeight: 800
});
global.document = Object.assign(new EventTarget(), {
  referrer: '', visibilityState: 'visible', hasFocus: () => true
});
Object.defineProperty(global, 'navigator', {
  value: { userAgent: 'Firefox/100', onLine: true, maxTouchPoints: 0, language: 'en' }, configurable: true
});
function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), clear: () => data.clear() };
}
global.localStorage = memoryStorage();
global.sessionStorage = memoryStorage();
const compiled = new Module(path.join(__dirname, 'services-bundle.cjs'), module);
compiled.filename = path.join(__dirname, 'services-bundle.cjs');
compiled.paths = Module._nodeModulePaths(__dirname);
compiled._compile(bundle, compiled.filename);
const { analytics, isSupabaseConfigured, isRealtimeConfigured } = compiled.exports;
const Engine = analytics.constructor;

test('development game events and exits stay local even with remote env configuration', async () => {
  assert.equal(isSupabaseConfigured, false);
  assert.equal(isRealtimeConfigured, false);
  const engine = new Engine();
  engine.init();
  engine.trackGameStart('daily');
  engine.trackWordSubmission('FORT', true);
  engine.trackGameEnd('daily', true, 5, 5, 20);
  window.dispatchEvent(new Event('pagehide'));
  const summary = await engine.fetchAnalyticsSummary();
  assert.equal(summary.isUsingSupabase, false);
  assert.equal(fetches, 0);
  engine.destroy();
});

test('analytics updates persist after first serialization and do not double session time', async () => {
  localStorage.clear();
  sessionStorage.clear();
  const engine = new Engine();
  engine.init();
  engine.activeSecondsInSession = 25;
  engine.trackGameStart('daily');
  engine.activeSecondsInSession = 40;
  engine.trackGameStart('rush');
  const summary = await engine.fetchAnalyticsSummary();
  const cache = JSON.parse(localStorage.getItem('poople_analytics_local_store'));
  assert.equal(cache.sessions[engine.getSessionId()].duration, 40);
  assert.deepEqual(cache.sessions[engine.getSessionId()].modes, ['daily', 'rush']);
  assert.equal(summary.totalDurationSeconds, 40);
  assert.equal(summary.modeBreakdown.rush, 1);
  assert.equal(summary.totalSessions, 1);
  engine.destroy();
});

test('blocked browser storage cannot throw from game tracking', async () => {
  const originalLocal = localStorage;
  const originalSession = sessionStorage;
  global.localStorage = global.sessionStorage = {
    getItem() { throw new Error('Storage blocked'); }, setItem() { throw new Error('Storage blocked'); }
  };
  const engine = new Engine();
  assert.doesNotThrow(() => engine.init());
  assert.doesNotThrow(() => engine.trackGameStart('daily'));
  assert.doesNotThrow(() => engine.trackWordSubmission('POOP', true));
  assert.equal(Number.isFinite((await engine.fetchAnalyticsSummary()).totalDurationSeconds), true);
  engine.destroy();
  global.localStorage = originalLocal;
  global.sessionStorage = originalSession;
});

test('destroy removes activity listeners before the engine is restarted', () => {
  const engine = new Engine();
  engine.init();
  engine.lastActiveTimestamp = Date.now() - 5000;
  window.dispatchEvent(new Event('blur'));
  assert.equal(engine.getSessionDuration(), 5);
  engine.destroy();
  engine.isWindowFocused = true;
  engine.lastActiveTimestamp = Date.now() - 10000;
  window.dispatchEvent(new Event('blur'));
  assert.equal(engine.getSessionDuration(), 5);
});
