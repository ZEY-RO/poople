import { GameSettings, PlayerStats, DailyResult } from '../types/game';

const SETTINGS_KEY = 'poople_settings_v1';
const STATS_KEY = 'poople_stats_v1';
const DAILY_STATE_PREFIX = 'poople_daily_';
const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_SETTINGS: GameSettings = {
  theme: 'classic',
  soundEnabled: true,
  soundVolume: 0.7,
  soundProfile: 'cartoon',
  hapticsEnabled: true,
  hardMode: false,
  showDeadEndRadar: true,
  keyboardLayout: 'qwerty',
  highContrast: false,
  reduceMotion: false
};

export const DEFAULT_STATS: PlayerStats = {
  dailyPlayed: 0,
  dailyWins: 0,
  currentStreak: 0,
  maxStreak: 0,
  dailyHistory: {},
  unlimitedPlayed: 0,
  unlimitedWins: 0,
  flawlessCount: 0,
  rushHighScore: 0,
  rushBestSolved: 0,
  versusWins: 0,
  versusLosses: 0,
  campaignStars: {}
};

type StoredObject = Record<string, unknown>;
function isObject(value: unknown): value is StoredObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
function dayNumber(date: unknown): number | null {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  return Math.floor(parsed.getTime() / DAY_MS);
}
function todayNumber(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}
function readObject(key: string): StoredObject {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || '{}');
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Playing remains available when browser storage is blocked or full.
  }
}

export function loadSettings(): GameSettings {
  const raw = readObject(SETTINGS_KEY);
  const settings = { ...DEFAULT_SETTINGS };
  const boolKeys = ['soundEnabled', 'hapticsEnabled', 'hardMode', 'showDeadEndRadar', 'highContrast', 'reduceMotion'] as const;
  for (const key of boolKeys) {
    if (typeof raw[key] === 'boolean') settings[key] = raw[key];
  }
  if (typeof raw.soundVolume === 'number' && Number.isFinite(raw.soundVolume)) {
    settings.soundVolume = Math.min(1, Math.max(0, raw.soundVolume));
  }
  const enums = {
    theme: ['classic', 'dark', 'poop', 'retro', 'gold', 'pastel'],
    soundProfile: ['cartoon', 'arcade', 'clean'],
    keyboardLayout: ['qwerty', 'azerty', 'dvorak', 'abc']
  } as const;
  for (const key of ['theme', 'soundProfile', 'keyboardLayout'] as const) {
    const value = raw[key];
    if (typeof value === 'string' && (enums[key] as readonly string[]).includes(value)) {
      Object.assign(settings, { [key]: value });
    }
  }
  return settings;
}

export function saveSettings(settings: GameSettings): void {
  write(SETTINGS_KEY, settings);
}

/** Derive streaks chronologically, so archive play cannot move a streak backwards. */
function updateStreaks(stats: PlayerStats): void {
  const today = todayNumber();
  const playedDates = Object.keys(stats.dailyHistory).sort();
  const winningDays = playedDates
    .filter(date => stats.dailyHistory[date].won)
    .map(date => dayNumber(date)!)
    .filter(day => day <= today);
  let run = 0;
  let previous = -Infinity;
  for (const day of winningDays) {
    run = day === previous + 1 ? run + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, run);
    previous = day;
  }
  stats.currentStreak = previous >= today - 1 ? run : 0;
  stats.lastDailyPlayedDate = playedDates.filter(date => dayNumber(date)! <= today).pop();
}

export function loadStats(): PlayerStats {
  const raw = readObject(STATS_KEY);
  const stats: PlayerStats = { ...DEFAULT_STATS, dailyHistory: {}, campaignStars: {} };
  const counters = ['dailyPlayed', 'dailyWins', 'maxStreak', 'unlimitedPlayed', 'unlimitedWins', 'flawlessCount', 'rushHighScore', 'rushBestSolved', 'versusWins', 'versusLosses'] as const;
  for (const key of counters) stats[key] = count(raw[key]);
  if (isObject(raw.dailyHistory)) {
    for (const [date, entry] of Object.entries(raw.dailyHistory)) {
      if (dayNumber(date) === null || !isObject(entry) || typeof entry.won !== 'boolean' ||
        typeof entry.startWord !== 'string' || !/^[A-Z]{4}$/.test(entry.startWord)) continue;
      stats.dailyHistory[date] = {
        date,
        startWord: entry.startWord,
        steps: count(entry.steps),
        par: count(entry.par),
        won: entry.won,
        hintsUsed: count(entry.hintsUsed),
        timeSeconds: count(entry.timeSeconds)
      };
    }
  }
  if (isObject(raw.campaignStars)) {
    for (const [id, stars] of Object.entries(raw.campaignStars)) {
      const stageId = Number(id);
      if (Number.isInteger(stageId) && stageId >= 1 && stageId <= 50 && typeof stars === 'number' && stars >= 1 && stars <= 3) {
        stats.campaignStars[stageId] = Math.floor(stars);
      }
    }
  }
  stats.dailyPlayed = Math.max(stats.dailyPlayed, Object.keys(stats.dailyHistory).length);
  stats.dailyWins = Math.max(stats.dailyWins, Object.values(stats.dailyHistory).filter(result => result.won).length);
  updateStreaks(stats);
  return stats;
}

export function saveStats(stats: PlayerStats): void {
  write(STATS_KEY, stats);
}

export function recordDailyCompletion(result: DailyResult): PlayerStats {
  const stats = loadStats();
  if (dayNumber(result.date) === null) return stats;
  const previous = stats.dailyHistory[result.date];
  // Keep the first winning result; practice replays must not change official scores.
  if (previous?.won) return stats;
  if (!previous) stats.dailyPlayed += 1;
  if (result.won) {
    stats.dailyWins += 1;
    if (result.steps <= result.par) stats.flawlessCount += 1;
  }
  stats.dailyHistory[result.date] = { ...result };
  updateStreaks(stats);
  saveStats(stats);
  return stats;
}

export function saveCampaignStars(stageId: number, stars: number): PlayerStats {
  const stats = loadStats();
  if (!Number.isInteger(stageId) || stageId < 1 || stageId > 50 || !Number.isFinite(stars)) return stats;
  const earned = Math.min(3, Math.max(0, Math.floor(stars)));
  if (earned > (stats.campaignStars[stageId] || 0)) {
    stats.campaignStars[stageId] = earned;
    saveStats(stats);
  }
  return stats;
}

export function saveDailyGameState(dateKey: string, state: unknown): void {
  if (dayNumber(dateKey) !== null) write(DAILY_STATE_PREFIX + dateKey, state);
}

export function loadDailyGameState<T>(dateKey: string): T | null {
  if (dayNumber(dateKey) === null) return null;
  try {
    const raw = localStorage.getItem(DAILY_STATE_PREFIX + dateKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
