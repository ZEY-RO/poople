import { CURATED_START_WORDS } from '../data/dictionary';
import { findShortestPath } from './solver';

const LAUNCH_DATE = new Date('2024-01-01T00:00:00Z');

// Filter curated words to those that have valid paths with interesting lengths (3 to 6 steps)
const VALID_DAILY_WORDS: Array<{ word: string; par: number; path: string[] }> = [];

for (const word of CURATED_START_WORDS) {
  if (word === 'POOP') continue;
  const path = findShortestPath(word, 'POOP');
  if (path && path.length >= 4 && path.length <= 8) {
    VALID_DAILY_WORDS.push({
      word,
      par: path.length - 1,
      path
    });
  }
}

// Simple deterministic hash for string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function formatDateToKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDayNumber(dateKey: string): number {
  const current = new Date(dateKey + 'T00:00:00Z');
  const diffTime = current.getTime() - LAUNCH_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

export function getDailyPuzzle(dateKey: string = formatDateToKey()): {
  date: string;
  dayNumber: number;
  startWord: string;
  par: number;
  optimalPath: string[];
} {
  const hash = hashString(dateKey);
  const index = hash % VALID_DAILY_WORDS.length;
  const puzzle = VALID_DAILY_WORDS[index] || {
    word: 'FART',
    par: 4,
    path: ['FART', 'FORT', 'PORT', 'POST', 'POOP']
  };

  return {
    date: dateKey,
    dayNumber: getDayNumber(dateKey),
    startWord: puzzle.word,
    par: puzzle.par,
    optimalPath: puzzle.path
  };
}

export function getRecentDailyPuzzles(count: number = 30): Array<{
  date: string;
  dayNumber: number;
  startWord: string;
  par: number;
}> {
  const list: Array<{ date: string; dayNumber: number; startWord: string; par: number }> = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDateToKey(d);
    const puzzle = getDailyPuzzle(key);
    list.push({
      date: key,
      dayNumber: puzzle.dayNumber,
      startWord: puzzle.startWord,
      par: puzzle.par
    });
  }

  return list;
}

export function getTimeUntilNextDaily(): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diffMs = tomorrow.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
}
