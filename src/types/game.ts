export type GameMode = 'daily' | 'unlimited' | 'rush' | 'versus' | 'campaign' | 'custom';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';

export interface Step {
  word: string;
  changedIndex: number | null; // index (0..3) of character that changed from previous word
  timestamp: number;
}

export interface GameState {
  mode: GameMode;
  startWord: string;
  targetWord: string; // Defaults to "POOP"
  currentInput: string;
  history: Step[];
  status: 'playing' | 'won' | 'lost' | 'idle';
  par: number;
  optimalPath: string[];
  startTime: number;
  endTime: number | null;
  hintsUsed: number;
  revealedHints: string[];
  deadEndDetected?: boolean;
  dailyDate?: string;
  stageId?: number;
  difficulty?: Difficulty;
}

export type BotPersonality = 'easy' | 'medium' | 'hard';

export interface BotConfig {
  id: BotPersonality;
  name: string;
  avatar: string;
  title: string;
  thinkSpeedMs: [number, number]; // min, max ms per step
  mistakeProbability: number; // 0 to 1
  description: string;
}

export interface BotState {
  config: BotConfig;
  currentWord: string;
  history: Step[];
  status: 'thinking' | 'idle' | 'won';
  stepCount: number;
  progressPercent: number;
}

export interface DailyResult {
  date: string;
  startWord: string;
  steps: number;
  par: number;
  won: boolean;
  hintsUsed: number;
  timeSeconds: number;
}

export interface PlayerStats {
  dailyPlayed: number;
  dailyWins: number;
  currentStreak: number;
  maxStreak: number;
  lastDailyPlayedDate?: string;
  dailyHistory: Record<string, DailyResult>;
  unlimitedPlayed: number;
  unlimitedWins: number;
  flawlessCount: number;
  rushHighScore: number;
  rushBestSolved: number;
  versusWins: number;
  versusLosses: number;
  campaignStars: Record<number, number>; // stageId: stars (1-3)
}

export type ThemeId = 'classic' | 'dark' | 'poop' | 'retro' | 'gold' | 'pastel';
export type SoundProfile = 'cartoon' | 'arcade' | 'clean';
export type KeyboardLayout = 'qwerty' | 'azerty' | 'dvorak' | 'abc';

export interface GameSettings {
  theme: ThemeId;
  soundEnabled: boolean;
  soundVolume: number;
  soundProfile: SoundProfile;
  hapticsEnabled: boolean;
  hardMode: boolean; // Cannot undo / must be optimal
  showDeadEndRadar: boolean;
  keyboardLayout: KeyboardLayout;
  highContrast: boolean;
  reduceMotion: boolean;
}

export interface CampaignStage {
  id: number;
  name: string;
  startWord: string;
  targetWord: string;
  par: number;
  difficulty: Difficulty;
  category: string;
  description: string;
}
