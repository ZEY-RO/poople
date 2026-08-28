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
  const w = word.toUpperCase();
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

/**
 * Finds the shortest path using Breadth-First Search (BFS).
 * Returns array of words [start, step1, ..., target] or null if unreachable.
 */
export function findShortestPath(start: string, target: string = 'POOP'): string[] | null {
  const s = start.toUpperCase();
  const t = target.toUpperCase();

  if (s === t) return [s];
  if (!WORD_SET.has(s) || !WORD_SET.has(t)) return null;

  const queue: string[] = [s];
  const visited = new Map<string, string | null>();
  visited.set(s, null);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === t) {
      // Reconstruct path
      const path: string[] = [];
      let curr: string | null = t;
      while (curr !== null) {
        path.push(curr);
        curr = visited.get(curr) || null;
      }
      return path.reverse();
    }

    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  return null;
}

/**
 * Returns the exact Par (minimum steps) from start to target.
 */
export function getPar(start: string, target: string = 'POOP'): number {
  const path = findShortestPath(start, target);
  return path ? path.length - 1 : -1;
}

/**
 * Checks if current word has reached a dead end (no path to target).
 */
export function isDeadEnd(currentWord: string, target: string = 'POOP'): boolean {
  return findShortestPath(currentWord, target) === null;
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
  // Try curated list first for great vocabulary
  const shuffledCurated = [...CURATED_START_WORDS].sort(() => Math.random() - 0.5);
  for (const word of shuffledCurated) {
    if (word === target) continue;
    const path = findShortestPath(word, target);
    if (path) {
      const par = path.length - 1;
      if (par >= minSteps && par <= maxSteps) {
        return { startWord: word, par, optimalPath: path };
      }
    }
  }

  // Fallback to random dictionary word
  const shuffledAll = [...FOUR_LETTER_WORDS].sort(() => Math.random() - 0.5);
  for (const word of shuffledAll) {
    if (word === target) continue;
    const path = findShortestPath(word, target);
    if (path) {
      const par = path.length - 1;
      if (par >= minSteps && par <= maxSteps) {
        return { startWord: word, par, optimalPath: path };
      }
    }
  }

  // Default guaranteed starter
  const defaultWord = 'FART';
  const defaultPath = findShortestPath(defaultWord, target) || ['FART', 'FORT', 'PORT', 'POST', 'POOT', 'POOP'];
  return { startWord: defaultWord, par: defaultPath.length - 1, optimalPath: defaultPath };
}
