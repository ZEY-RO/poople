import { BotConfig, BotPersonality, Step } from '../types/game';
import { findShortestPath, getDiffIndex, getNeighbors, getPar } from './solver';

export const BOT_CONFIGS: Record<BotPersonality, BotConfig> = {
  easy: {
    id: 'easy',
    name: 'Sloppy Plunger',
    avatar: '🪠',
    title: 'Novice Sweeper',
    thinkSpeedMs: [2500, 4200],
    mistakeProbability: 0.28,
    description: 'Takes relaxed breaks and sometimes wanders down side pipes.'
  },
  medium: {
    id: 'medium',
    name: 'Speedy Flush',
    avatar: '🚽',
    title: 'Pipe Technician',
    thinkSpeedMs: [1600, 2600],
    mistakeProbability: 0.10,
    description: 'Fast and reliable with great plumbing instincts.'
  },
  hard: {
    id: 'hard',
    name: 'Grandmaster Commode',
    avatar: '👑',
    title: 'The Golden Sovereign',
    thinkSpeedMs: [1000, 1800],
    mistakeProbability: 0.0,
    description: 'Zero mistakes. Calculates the pure optimal route every time.'
  }
};

/**
 * Calculates the next step for a bot given its current word and personality.
 */
export function getNextBotMove(
  currentWord: string,
  targetWord: string = 'POOP',
  personality: BotPersonality = 'medium'
): { nextWord: string; step: Step } | null {
  const config = BOT_CONFIGS[personality];
  const optimalPath = findShortestPath(currentWord, targetWord);

  if (!optimalPath || optimalPath.length <= 1) {
    return null;
  }

  let nextWord = optimalPath[1];

  // Chance of taking a suboptimal detour if bot is easy or medium
  if (config.mistakeProbability > 0 && Math.random() < config.mistakeProbability && optimalPath.length > 2) {
    const neighbors = getNeighbors(currentWord).filter(w => w !== currentWord);
    // Find a neighbor that is NOT optimal but still solvable
    const detours = neighbors.filter(w => {
      const p = getPar(w, targetWord);
      return p > 0 && p >= optimalPath.length - 1; // sideways or backward step
    });

    if (detours.length > 0) {
      nextWord = detours[Math.floor(Math.random() * detours.length)];
    }
  }

  const diffIdx = getDiffIndex(currentWord, nextWord);

  return {
    nextWord,
    step: {
      word: nextWord,
      changedIndex: diffIdx,
      timestamp: Date.now()
    }
  };
}

export function getRandomThinkDelay(personality: BotPersonality): number {
  const [min, max] = BOT_CONFIGS[personality].thinkSpeedMs;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
