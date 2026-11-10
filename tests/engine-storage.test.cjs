const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

// Compile only pure game modules; no browser, network or additional dependency needed.
const buildDir = mkdtempSync(path.join(tmpdir(), 'poople-tests-'));
execFileSync(path.resolve('node_modules/.bin/tsc'), [
  'src/engine/solver.ts', 'src/engine/campaign.ts', 'src/engine/daily.ts', 'src/services/storage.ts',
  '--outDir', buildDir, '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck'
]);
after(() => rmSync(buildDir, { recursive: true, force: true }));
const solver = require(path.join(buildDir, 'engine/solver.js'));
const { CAMPAIGN_STAGES } = require(path.join(buildDir, 'engine/campaign.js'));
const { getDailyPuzzle } = require(path.join(buildDir, 'engine/daily.js'));
const storage = require(path.join(buildDir, 'services/storage.js'));
const stored = new Map();
global.localStorage = {
  getItem: key => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value)
};

function assertLadder(words) {
  assert.ok(words.length > 1);
  for (let i = 1; i < words.length; i++) {
    assert.equal(solver.isValidStep(words[i - 1], words[i]).valid, true, `${words[i - 1]} -> ${words[i]}`);
  }
}
function dateBefore(days) {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - days));
  return date.toISOString().slice(0, 10);
}
function result(date, overrides = {}) {
  return { date, startWord: 'FART', steps: 5, par: 5, won: true, hintsUsed: 0, timeSeconds: 20, ...overrides };
}

test('solver validates endpoints, normalizes input, and returns shortest legal ladders', () => {
  assert.equal(solver.findShortestPath('XXXX', 'XXXX'), null);
  assert.deepEqual(solver.findShortestPath(' poop ', 'POOP'), ['POOP']);
  assert.equal(solver.getPar('ODOR'), -1);
  assert.equal(solver.getPar('LOOP'), 1);
  assert.equal(solver.getNeighbors('LOO').length, 0);
  assert.equal(solver.isValidStep('LOOP', 'POOP').valid, true);
  assert.equal(solver.isValidStep('POST', 'POOP').valid, false);
  const words = solver.findShortestPath('FART');
  assertLadder(words);
  assert.equal(solver.getPar('FART'), words.length - 1);
  assert.equal(solver.getOptimalHint('FART').nextWord, words[1]);
  for (const neighbor of solver.getNeighborEvaluations('FART')) {
    assert.equal(neighbor.distanceToTarget, solver.getPar(neighbor.word));
  }
});

test('each difficulty generates legal puzzles in its promised range', () => {
  for (const [min, max] of [[2, 3], [4, 5], [6, 7], [8, 10]]) {
    for (let i = 0; i < 25; i++) {
      const puzzle = solver.getRandomPuzzle(min, max);
      assert.ok(puzzle.par >= min && puzzle.par <= max, `${puzzle.startWord}: ${puzzle.par}`);
      assert.equal(puzzle.startWord, puzzle.optimalPath[0]);
      assert.equal(puzzle.optimalPath.at(-1), 'POOP');
      assert.equal(puzzle.par, puzzle.optimalPath.length - 1);
      assertLadder(puzzle.optimalPath);
    }
  }
});

test('unavailable custom distance falls back to an actual legal ladder', () => {
  const puzzle = solver.getRandomPuzzle(8, 10, 'odor');
  assert.equal(puzzle.startWord, 'ODOX');
  assert.equal(puzzle.par, 1);
  assertLadder(puzzle.optimalPath);
  assert.throws(() => solver.getRandomPuzzle(3, 6, 'XXXX'));
});

test('all 50 campaign stages are reachable with accurate par', () => {
  assert.equal(CAMPAIGN_STAGES.length, 50);
  for (const stage of CAMPAIGN_STAGES) {
    const ladder = solver.findShortestPath(stage.startWord, stage.targetWord);
    assertLadder(ladder);
    assert.equal(stage.par, ladder.length - 1, `Stage ${stage.id}`);
  }
});

test('daily puzzles are deterministic and have legal routes', () => {
  for (let day = 0; day < 30; day++) {
    const puzzle = getDailyPuzzle(dateBefore(day));
    assert.deepEqual(puzzle, getDailyPuzzle(dateBefore(day)));
    assertLadder(puzzle.optimalPath);
    assert.equal(puzzle.par, puzzle.optimalPath.length - 1);
  }
});

test('corrupt settings and nested statistics recover safely', () => {
  stored.clear();
  stored.set('poople_settings_v1', JSON.stringify({ theme: 'missing', keyboardLayout: 'bad', soundProfile: null, soundEnabled: 'yes', soundVolume: 10 }));
  const settings = storage.loadSettings();
  assert.equal(settings.theme, 'classic');
  assert.equal(settings.keyboardLayout, 'qwerty');
  assert.equal(settings.soundEnabled, true);
  assert.equal(settings.soundVolume, 1);
  stored.set('poople_stats_v1', JSON.stringify({ dailyHistory: null, campaignStars: [], dailyWins: -4, rushHighScore: '99' }));
  const stats = storage.loadStats();
  assert.deepEqual(stats.dailyHistory, {});
  assert.deepEqual(stats.campaignStars, {});
  assert.equal(stats.dailyWins, 0);
  assert.equal(stats.rushHighScore, 0);
  stats.dailyHistory.example = {};
  assert.deepEqual(storage.DEFAULT_STATS.dailyHistory, {});
  stored.set('poople_stats_v1', '{broken');
  assert.equal(storage.loadStats().dailyPlayed, 0);
});

test('archive completions count streaks chronologically and preserve winning scores', () => {
  stored.clear();
  storage.recordDailyCompletion(result(dateBefore(2)));
  storage.recordDailyCompletion(result(dateBefore(0)));
  let stats = storage.recordDailyCompletion(result(dateBefore(1)));
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.maxStreak, 3);
  assert.equal(stats.lastDailyPlayedDate, dateBefore(0));
  stats = storage.recordDailyCompletion(result(dateBefore(15)));
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.dailyWins, 4);
  stats = storage.recordDailyCompletion(result(dateBefore(0), { steps: 10, hintsUsed: 3 }));
  assert.equal(stats.dailyPlayed, 4);
  assert.equal(stats.dailyWins, 4);
  assert.equal(stats.dailyHistory[dateBefore(0)].steps, 5);
  assert.equal(stats.dailyHistory[dateBefore(0)].hintsUsed, 0);
});

test('expired streak clears and a previous loss can become a win once', () => {
  stored.clear();
  storage.recordDailyCompletion(result(dateBefore(5)));
  assert.equal(storage.loadStats().currentStreak, 0);
  storage.recordDailyCompletion(result(dateBefore(0), { won: false }));
  const stats = storage.recordDailyCompletion(result(dateBefore(0)));
  assert.equal(stats.dailyPlayed, 2);
  assert.equal(stats.dailyWins, 2);
  assert.equal(stats.currentStreak, 1);
});

test('campaign stars only increase and are bounded to real stages', () => {
  stored.clear();
  storage.saveCampaignStars(1, 3);
  storage.saveCampaignStars(1, 1);
  storage.saveCampaignStars(2, 100);
  storage.saveCampaignStars(-1, 3);
  const stats = storage.loadStats();
  assert.equal(stats.campaignStars[1], 3);
  assert.equal(stats.campaignStars[2], 3);
  assert.equal(stats.campaignStars[-1], undefined);
});

test('blocked browser storage does not prevent play', () => {
  const usableStorage = global.localStorage;
  global.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(storage.loadSettings().theme, 'classic');
  assert.equal(storage.loadStats().dailyPlayed, 0);
  assert.doesNotThrow(() => storage.saveSettings(storage.DEFAULT_SETTINGS));
  assert.doesNotThrow(() => storage.recordDailyCompletion(result(dateBefore(0))));
  global.localStorage = usableStorage;
});
