import React, { useState, useEffect } from 'react';
import { Calendar, Flame, History } from 'lucide-react';
import { getTimeUntilNextDaily, getRecentDailyPuzzles } from '../engine/daily';
import { soundFx } from '../services/audio';

interface DailyModeViewProps {
  dayNumber: number;
  dateKey: string;
  currentStreak: number;
  maxStreak: number;
  onSelectDate: (dateStr: string) => void;
  completedHistory: Record<string, { won: boolean; steps: number; par: number }>;
}

export const DailyModeView: React.FC<DailyModeViewProps> = ({
  dayNumber,
  dateKey,
  currentStreak,
  maxStreak,
  onSelectDate,
  completedHistory
}) => {
  const [showArchive, setShowArchive] = useState(false);
  const [countdown, setCountdown] = useState(getTimeUntilNextDaily());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilNextDaily());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const archives = getRecentDailyPuzzles(21);

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-1 pb-2">
      {/* Daily Banner Card */}
      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-500/10 dark:bg-slate-800 border border-amber-300/40 dark:border-slate-700">
        {/* Left: Day & Date */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-display font-black text-amber-950 dark:text-amber-300">
              Daily Poople #{dayNumber}
            </h2>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
              {dateKey}
            </p>
          </div>
        </div>

        {/* Right: Streaks & Next Puzzle Countdown */}
        <div className="flex items-center gap-3">
          {/* Streak Counter */}
          <div className="flex items-center gap-1" title={`Current Streak: ${currentStreak} (Max: ${maxStreak})`}>
            <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-amber-500 animate-bounceShort' : 'text-stone-400'}`} />
            <span className="font-display font-black text-sm text-amber-900 dark:text-amber-200">
              {currentStreak}
            </span>
          </div>

          {/* Archive Toggle Button */}
          <button
            onClick={() => {
              soundFx.playKey();
              setShowArchive(!showArchive);
            }}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-slate-600 hover:bg-amber-100 dark:hover:bg-slate-600 btn-press"
            title="Past Daily Archive"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Archive Dropdown Drawer */}
      {showArchive && (
        <div className="mt-2 p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-stone-200 dark:border-slate-700 animate-pop">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Past Daily Puzzles
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">
              Next in {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-1">
            {archives.map(item => {
              const record = completedHistory[item.date];
              const isSelected = item.date === dateKey;
              return (
                <button
                  key={item.date}
                  onClick={() => {
                    soundFx.playKey();
                    onSelectDate(item.date);
                    setShowArchive(false);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all btn-press ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : record?.won
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-stone-50 dark:bg-slate-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-600'
                  }`}
                >
                  <div className="text-[10px] font-bold opacity-75">#{item.dayNumber}</div>
                  <div className="text-xs font-mono font-black">{item.startWord}</div>
                  <div className="text-[9px] mt-0.5 font-semibold">
                    {record ? (record.won ? `✓ (${record.steps})` : '✕') : `Par ${item.par}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
