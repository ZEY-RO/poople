import { FOUR_LETTER_WORDS, WORD_SET, CURATED_START_WORDS } from '../data/dictionary';

// Precomputed wildcard pattern buckets for ultra-fast neighbor lookups
const BUCKETS: Map<string, string[]> = new Map();

function initBuckets() {
  if (BUCKETS.size > 0) return;
  for (const word of FOUR_LETTER_WORDS) {
    const w = word.toUpperCase();
    for (let i = 0; i < 4; i++) {
      const pattern = w.slice(0, i) + '*' + w.slice(i + 1);
      const list = BUCKETS.get(pattern);
      if (list) {
        list.push(w);
      } else {
        BUCKETS.set(pattern, [w]);
      }
    }
  }
}

// Initialize on module load
initBuckets();

/**
 * Returns all valid dictionary words that differ from `word` by exactly one letter.
 */
export function getNeighbors(word: string): string[] {
  const w = word.toUpperCase().trim();
  if (!/^[A-Z]{4}$/.test(w) || !WORD_SET.has(w)) return [];
  const neighbors = new Set<string>();
  for (let i = 0; i < 4; i++) {
    const pattern = w.slice(0, i) + '*' + w.slice(i + 1);
    const bucket = BUCKETS.get(pattern);
    if (bucket) {
      for (const neighbor of bucket) {
        if (neighbor !== w) {
          neighbors.add(neighbor);
        }
      }
    }
  }
  return Array.from(neighbors);
}

/**
 * Calculates single-character difference between two 4-letter words.
 * Returns the index (0..3) of change, or -1 if diff count != 1.
 */
export function getDiffIndex(w1: string, w2: string): number {
  if (w1.length !== 4 || w2.length !== 4) return -1;
  const a = w1.toUpperCase();
  const b = w2.toUpperCase();
  let diffCount = 0;
  let diffIndex = -1;
  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i]) {
      diffCount++;
      diffIndex = i;
    }
  }
  return diffCount === 1 ? diffIndex : -1;
}

/**
 * Validates whether `nextWord` is a legitimate next move from `prevWord`.
 */
export function isValidStep(
  prevWord: string,
  nextWord: string
): { valid: boolean; reason?: string; changedIndex?: number } {
  const next = nextWord.toUpperCase().trim();
  const prev = prevWord.toUpperCase().trim();

  if (next.length !== 4) {
    return { valid: false, reason: 'Word must be exactly 4 letters long.' };
  }

  if (!/^[A-Z]{4}$/.test(next)) {
    return { valid: false, reason: 'Letters only (A-Z).' };
  }

  if (!WORD_SET.has(next)) {
    return { valid: false, reason: `"${next}" is not in the dictionary.` };
  }

  if (next === prev) {
    return { valid: false, reason: 'Word is identical to the current word.' };
  }

  const diffIdx = getDiffIndex(prev, next);
  if (diffIdx === -1) {
    return { valid: false, reason: 'Must change exactly one letter.' };
  }

  return { valid: true, changedIndex: diffIdx };
}

// A reverse BFS serves every distance, hint and neighbor evaluation for a target.
// Keep this cache bounded because custom puzzles can use any dictionary target.
const TARGET_CACHE = new Map<string, Map<string, { distance: number; next: string | null }>>();
const MAX_CACHED_TARGETS = 12;

function getTargetRoutes(target: string): Map<string, { distance: number; next: string | null }> {
  const cached = TARGET_CACHE.get(target);
  if (cached) return cached;

  const routes = new Map<string, { distance: number; next: string | null }>();
  if (!WORD_SET.has(target)) return routes;
  routes.set(target, { distance: 0, next: null });
  const queue = [target];
  for (let head = 0; head < queue.length; head++) {
    const word = queue[head];
    const distance = routes.get(word)!.distance + 1;
    for (const neighbor of getNeighbors(word)) {
      if (routes.has(neighbor)) continue;
      routes.set(neighbor, { distance, next: word });
      queue.push(neighbor);
    }
  }

  if (TARGET_CACHE.size >= MAX_CACHED_TARGETS) {
    TARGET_CACHE.delete(TARGET_CACHE.keys().next().value!);
  }
  TARGET_CACHE.set(target, routes);
  return routes;
}

/** Returns a shortest legal ladder, including both endpoints, or null. */
export function findShortestPath(start: string, target: string = 'POOP'): string[] | null {
  const s = start.toUpperCase().trim();
  const t = target.toUpperCase().trim();
  if (!WORD_SET.has(s) || !WORD_SET.has(t)) return null;
  const routes = getTargetRoutes(t);
  if (!routes.has(s)) return null;
  const path = [s];
  let current = s;
  while (current !== t) {
    current = routes.get(current)!.next!;
    path.push(current);
  }
  return path;
}

/** Returns the exact minimum steps from start to target, or -1 if unreachable. */
export function getPar(start: string, target: string = 'POOP'): number {
  return getTargetRoutes(target.toUpperCase().trim()).get(start.toUpperCase().trim())?.distance ?? -1;
}

/**
 * Checks if current word has reached a dead end (no path to target).
 */
export function isDeadEnd(currentWord: string, target: string = 'POOP'): boolean {
  return getPar(currentWord, target) < 0;
}

/**
 * Returns hint suggestion for current step towards target.
 */
export function getOptimalHint(
  currentWord: string,
  target: string = 'POOP'
): { nextWord: string; changedIndex: number; distanceRemaining: number } | null {
  const path = findShortestPath(currentWord, target);
  if (!path || path.length < 2) return null;

  const nextWord = path[1];
  const changedIndex = getDiffIndex(currentWord, nextWord);
  return {
    nextWord,
    changedIndex,
    distanceRemaining: path.length - 1
  };
}

/**
 * Returns list of next moves with optimal path delta (+1, 0, -1, or dead end).
 */
export function getNeighborEvaluations(
  currentWord: string,
  target: string = 'POOP'
): Array<{ word: string; distanceToTarget: number | null; isOptimal: boolean }> {
  const currentDist = getPar(currentWord, target);
  const neighbors = getNeighbors(currentWord);

  return neighbors.map(w => {
    const dist = getPar(w, target);
    return {
      word: w,
      distanceToTarget: dist >= 0 ? dist : null,
      isOptimal: dist >= 0 && currentDist >= 0 && dist === currentDist - 1
    };
  });
}

/**
 * Generates a solvable random start word within target step range.
 */
export function getRandomPuzzle(
  minSteps: number = 3,
  maxSteps: number = 6,
  target: string = 'POOP'
): { startWord: string; par: number; optimalPath: string[] } {
  const cleanTarget = target.toUpperCase().trim();
  const routes = getTargetRoutes(cleanTarget);
  if (!routes.size) throw new Error('The target must be a valid dictionary word.');
  const min = Number.isFinite(minSteps) ? Math.max(1, Math.floor(minSteps)) : 3;
  const max = Number.isFinite(maxSteps) ? Math.max(min, Math.floor(maxSteps)) : Math.max(min, 6);
  const inRange = (word: string) => {
    const distance = routes.get(word)?.distance ?? -1;
    return distance >= min && distance <= max;
  };

  // Prefer familiar words and choose uniformly rather than using a biased sort.
  let candidates = [...new Set(CURATED_START_WORDS)].filter(inRange);
  if (!candidates.length) candidates = [...routes.keys()].filter(inRange);
  if (!candidates.length) {
    // Some custom targets have small connected components. Fall back to the
    // closest available distance, never an invented or unreachable ladder.
    const available = [...routes.keys()].filter(word => word !== cleanTarget);
    if (!available.length) throw new Error('The target has no connected words.');
    const distanceFromRange = (word: string) => {
      const distance = routes.get(word)!.distance;
      return distance < min ? min - distance : Math.max(0, distance - max);
    };
    const closest = Math.min(...available.map(distanceFromRange));
    candidates = available.filter(word => distanceFromRange(word) === closest);
  }
  const startWord = candidates[Math.floor(Math.random() * candidates.length)];
  const optimalPath = findShortestPath(startWord, cleanTarget)!;
  return { startWord, par: optimalPath.length - 1, optimalPath };
}
