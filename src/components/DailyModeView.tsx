import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Flame, History, Check, ChevronUp } from 'lucide-react';
import { getTimeUntilNextDaily, getRecentDailyPuzzles, formatDateToKey } from '../engine/daily';
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
  dayNumber, dateKey, currentStreak, maxStreak, onSelectDate, completedHistory
}) => {
  const [showArchive, setShowArchive] = useState(false);
  const [countdown, setCountdown] = useState(getTimeUntilNextDaily);
  const today = formatDateToKey();
  const archives = useMemo(() => getRecentDailyPuzzles(30), [today]);
  useEffect(() => {
    const timer = setInterval(() => setCountdown(getTimeUntilNextDaily()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formattedDate = new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = [countdown.hours, countdown.minutes, countdown.seconds].map(n => String(n).padStart(2, '0')).join(':');

  return (
    <section className="w-full max-w-lg mx-auto px-4 pt-1 pb-3" aria-label="Daily puzzle details">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-theme-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarDays className="w-5 h-5 text-theme-accent shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-theme-text-primary">Daily puzzle <span className="text-theme-text-muted">#{dayNumber}</span></h2>
            <p className="text-[11px] text-theme-text-muted mt-0.5">{formattedDate}{dateKey !== today ? ' · Archive' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-sm font-semibold" title={`Current streak ${currentStreak}. Best streak ${maxStreak}.`} aria-label={`${currentStreak} day streak, best ${maxStreak}`}>
            <Flame className="w-4 h-4 text-theme-accent" />{currentStreak}
          </span>
          <button type="button" onClick={() => { soundFx.playKey(); setShowArchive(value => !value); }}
            className="min-h-10 px-2.5 flex items-center gap-1.5 rounded-lg border border-theme-border text-xs font-medium text-theme-text-secondary hover:bg-theme-bg-secondary btn-press"
            aria-expanded={showArchive} aria-controls="daily-archive" title="Browse past daily puzzles">
            {showArchive ? <ChevronUp className="w-4 h-4" /> : <History className="w-4 h-4" />}<span>Archive</span>
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-theme-text-muted">
        <span>{completedHistory[dateKey]?.won ? <span className="flex items-center gap-1 text-theme-accent"><Check className="w-3 h-3" /> Completed · play again for practice</span> : 'A fresh word ladder, every day.'}</span>
        <span className="tabular-nums shrink-0 ml-2" aria-label={`Next daily puzzle in ${countdown.hours} hours ${countdown.minutes} minutes`}>Next in {time}</span>
      </div>
      {showArchive && (
        <div id="daily-archive" className="mt-3 p-3 rounded-xl bg-theme-bg-secondary border border-theme-border animate-pop">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-semibold">Last 30 puzzles</h3>
            {dateKey !== today && <button type="button" onClick={() => { onSelectDate(today); setShowArchive(false); }} className="text-xs font-semibold text-theme-accent underline underline-offset-2">Back to today</button>}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto custom-scrollbar p-0.5">
            {archives.map(item => {
              const record = completedHistory[item.date];
              const isSelected = item.date === dateKey;
              return (
                <button type="button" key={item.date} onClick={() => { soundFx.playKey(); onSelectDate(item.date); setShowArchive(false); }}
                  aria-pressed={isSelected} aria-label={`Daily puzzle ${item.dayNumber}, ${item.date}, ${record?.won ? `completed in ${record.steps} steps` : `par ${item.par}`}`}
                  className={`p-2 rounded-lg text-left border btn-press ${isSelected ? 'bg-theme-accent text-theme-accent-text border-theme-accent' : 'bg-theme-bg-card text-theme-text-secondary border-theme-border hover:border-theme-accent'}`}>
                  <div className="text-[10px] opacity-75">{new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                  <div className="text-xs font-mono font-bold mt-1">{item.startWord}</div>
                  <div className={`text-[10px] mt-1 ${record?.won && !isSelected ? 'text-theme-accent' : ''}`}>{record?.won ? `✓ ${record.steps} steps` : `Par ${item.par}`}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
