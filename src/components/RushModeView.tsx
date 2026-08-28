import React from 'react';
import { Zap, Clock, Trophy, Flame, RotateCcw, FastForward } from 'lucide-react';
import { soundFx } from '../services/audio';

interface RushModeViewProps {
  isPlaying: boolean;
  timeLeft: number;
  totalTime: number;
  score: number;
  combo: number;
  wordsSolved: number;
  highScore: number;
  onStartRush: () => void;
  onSkipWord: () => void;
}

export const RushModeView: React.FC<RushModeViewProps> = ({
  isPlaying,
  timeLeft,
  totalTime,
  score,
  combo,
  wordsSolved,
  highScore,
  onStartRush,
  onSkipWord
}) => {
  const percentLeft = Math.max(0, (timeLeft / totalTime) * 100);

  const getTimerColor = () => {
    if (timeLeft > 45) return 'bg-emerald-500';
    if (timeLeft > 20) return 'bg-amber-500';
    return 'bg-rose-500 animate-pulse';
  };

  if (!isPlaying && timeLeft === 0) {
    // Game Over Summary for Rush
    return (
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-amber-300 dark:border-slate-700 text-center animate-pop">
          <div className="text-4xl mb-1">⏱️💨</div>
          <h2 className="text-xl font-display font-black text-amber-950 dark:text-amber-300">
            Time's Up!
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Great sprint! Here is your final flush report:
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-slate-700">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block">Final Score</span>
              <span className="text-2xl font-display font-black text-amber-600 dark:text-amber-400">
                {score}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-slate-700">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 block">Words Solved</span>
              <span className="text-2xl font-display font-black text-amber-600 dark:text-amber-400">
                {wordsSolved}
              </span>
            </div>
          </div>

          {score >= highScore && score > 0 && (
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-amber-400/20 text-amber-900 dark:text-amber-300 text-xs font-black flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              NEW HIGH SCORE!
            </div>
          )}

          <button
            onClick={() => {
              soundFx.playFlush();
              onStartRush();
            }}
            className="mt-4 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/30 flex items-center justify-center gap-2 btn-press"
          >
            <RotateCcw className="w-4 h-4" />
            Play Rush Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-1 pb-2">
      {/* Rush Header Card */}
      <div className="px-3 py-2 rounded-2xl bg-amber-500/10 dark:bg-slate-800 border border-amber-300/40 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {/* Left: Timer */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span className={`text-base font-display font-black ${
                  timeLeft <= 15 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-amber-950 dark:text-amber-300'
                }`}>
                  {timeLeft}s
                </span>
              </div>
              <span className="text-[10px] font-bold text-stone-400">
                Solved: {wordsSolved}
              </span>
            </div>
          </div>

          {/* Right: Score and Combo */}
          <div className="text-right flex items-center gap-3">
            {combo > 1 && (
              <div className="flex items-center gap-0.5 text-xs font-black text-amber-500 animate-bounceShort">
                <Flame className="w-3.5 h-3.5" />
                <span>{combo}x</span>
              </div>
            )}
            <div>
              <div className="text-lg font-display font-black text-amber-600 dark:text-amber-400">
                {score} pts
              </div>
              <div className="text-[10px] font-bold text-stone-400">
                Best: {highScore}
              </div>
            </div>

            {isPlaying && (
              <button
                onClick={() => {
                  soundFx.playKey();
                  onSkipWord();
                }}
                className="p-1.5 rounded-xl bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-slate-600 text-xs font-bold flex items-center gap-0.5 btn-press"
                title="Skip word (-5s)"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 mt-2 bg-stone-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${getTimerColor()}`}
            style={{ width: `${percentLeft}%` }}
          />
        </div>
      </div>
    </div>
  );
};
