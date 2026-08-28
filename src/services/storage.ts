import { GameSettings, PlayerStats, DailyResult } from '../types/game';

const SETTINGS_KEY = 'poople_settings_v1';
const STATS_KEY = 'poople_stats_v1';
const DAILY_STATE_PREFIX = 'poople_daily_';

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

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error reading settings', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error reading stats', e);
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving stats', e);
  }
}

export function recordDailyCompletion(result: DailyResult): PlayerStats {
  const stats = loadStats();
  const alreadyPlayed = stats.dailyHistory[result.date];

  if (!alreadyPlayed) {
    stats.dailyPlayed += 1;
    if (result.won) {
      stats.dailyWins += 1;
      
      // Calculate streak
      const lastDateStr = stats.lastDailyPlayedDate;
      if (lastDateStr) {
        const lastDate = new Date(lastDateStr);
        const currDate = new Date(result.date);
        const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          stats.currentStreak += 1;
        } else if (diffDays > 1) {
          stats.currentStreak = 1;
        }
      } else {
        stats.currentStreak = 1;
      }
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      stats.lastDailyPlayedDate = result.date;

      if (result.steps <= result.par) {
        stats.flawlessCount += 1;
      }
    } else {
      stats.currentStreak = 0;
    }
  }

  stats.dailyHistory[result.date] = result;
  saveStats(stats);
  return stats;
}

export function saveCampaignStars(stageId: number, stars: number): PlayerStats {
  const stats = loadStats();
  const current = stats.campaignStars[stageId] || 0;
  if (stars > current) {
    stats.campaignStars[stageId] = stars;
    saveStats(stats);
  }
  return stats;
}

export function saveDailyGameState(dateKey: string, state: unknown): void {
  try {
    localStorage.setItem(DAILY_STATE_PREFIX + dateKey, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving daily game state', e);
  }
}

export function loadDailyGameState<T>(dateKey: string): T | null {
  try {
    const raw = localStorage.getItem(DAILY_STATE_PREFIX + dateKey);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
