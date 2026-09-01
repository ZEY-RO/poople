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
      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-theme-bg-secondary border border-theme-border shadow-sm">
        {/* Left: Day & Date */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-theme-accent text-theme-accent-text shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-display font-black text-theme-text-primary">
              Daily Poople #{dayNumber}
            </h2>
            <p className="text-[11px] font-semibold text-theme-text-muted">
              {dateKey}
            </p>
          </div>
        </div>

        {/* Right: Streaks & Next Puzzle Countdown */}
        <div className="flex items-center gap-3">
          {/* Streak Counter */}
          <div className="flex items-center gap-1" title={`Current Streak: ${currentStreak} (Max: ${maxStreak})`}>
            <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-theme-accent animate-bounceShort' : 'opacity-40'}`} />
            <span className="font-display font-black text-sm text-theme-text-primary">
              {currentStreak}
            </span>
          </div>

          {/* Archive Toggle Button */}
          <button
            onClick={() => {
              soundFx.playKey();
              setShowArchive(!showArchive);
            }}
            className="p-1.5 rounded-xl bg-theme-bg-card text-theme-text-secondary border border-theme-border/60 hover:bg-theme-bg-muted btn-press"
            title="Past Daily Archive"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Archive Dropdown Drawer */}
      {showArchive && (
        <div className="mt-2 p-3 rounded-2xl bg-theme-modal shadow-xl border border-theme-border animate-pop">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-theme-text-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-theme-accent" />
              Past Daily Puzzles
            </h3>
            <span className="text-[10px] text-theme-text-muted font-mono">
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
                      ? 'bg-theme-accent text-theme-accent-text border-theme-accent font-black shadow-sm'
                      : record?.won
                      ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                      : 'bg-theme-modal-subcard text-theme-text-secondary border-theme-modal-subcard-border hover:bg-theme-bg-secondary'
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
