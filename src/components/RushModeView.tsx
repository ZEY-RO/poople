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
  isPlaying, timeLeft, totalTime, score, combo, wordsSolved, highScore, onStartRush, onSkipWord
}) => {
  const safeTime = Math.max(0, timeLeft);
  const percentLeft = totalTime > 0 ? Math.min(100, (safeTime / totalTime) * 100) : 0;
  const timerColor = safeTime > 45 ? 'bg-theme-accent' : safeTime > 20 ? 'bg-amber-500' : 'bg-rose-500';
  const timer = `${Math.floor(safeTime / 60)}:${String(safeTime % 60).padStart(2, '0')}`;

  if (!isPlaying) {
    const isFinished = safeTime === 0;
    return (
      <section className="w-full max-w-lg mx-auto px-4 py-4" aria-label={isFinished ? 'Rush results' : 'Start Rush'}>
        <div className="p-6 rounded-2xl bg-theme-bg-card border border-theme-border text-center animate-pop">
          <div className="w-12 h-12 rounded-full bg-theme-accent-light text-theme-accent flex items-center justify-center mx-auto mb-3"><Zap className="w-6 h-6" /></div>
          <h2 className="text-2xl font-display font-bold">{isFinished ? 'Time’s up!' : 'Ready for a rush?'}</h2>
          <p className="text-sm text-theme-text-muted mt-2">{isFinished ? 'Every ladder counts. Here’s how you did.' : 'Solve as many ladders as you can in two minutes.'}</p>
          {isFinished && (
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="p-4 rounded-xl bg-theme-bg-secondary"><span className="text-[11px] text-theme-text-muted block uppercase tracking-wider">Final score</span><span className="text-3xl font-bold text-theme-accent tabular-nums mt-1 block">{score}</span></div>
              <div className="p-4 rounded-xl bg-theme-bg-secondary"><span className="text-[11px] text-theme-text-muted block uppercase tracking-wider">Ladders solved</span><span className="text-3xl font-bold tabular-nums mt-1 block">{wordsSolved}</span></div>
            </div>
          )}
          {isFinished && score >= highScore && score > 0 && <p className="mt-4 text-theme-accent text-sm font-semibold flex items-center justify-center gap-2"><Trophy className="w-4 h-4" />Personal best!</p>}
          <button type="button" onClick={() => { soundFx.playFlush(); onStartRush(); }} className="mt-5 w-full py-3 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-text font-semibold text-sm flex items-center justify-center gap-2 btn-press">
            <RotateCcw className="w-4 h-4" />{isFinished ? 'Play again' : 'Start Rush'}
          </button>
          <p className="text-[11px] text-theme-text-muted mt-3">Best score: {highScore} · Skipping costs 5 seconds and resets your combo.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-lg mx-auto px-4 pt-1 pb-3" aria-label="Rush progress">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Clock className={`w-5 h-5 ${safeTime <= 15 ? 'text-rose-500' : 'text-theme-accent'}`} />
          <div><span className={`text-xl font-semibold tabular-nums ${safeTime <= 15 ? 'text-rose-500' : ''}`} role="timer" aria-label={`${safeTime} seconds remaining`}>{timer}</span><p className="text-[11px] text-theme-text-muted">{wordsSolved} {wordsSolved === 1 ? 'ladder' : 'ladders'} solved</p></div>
        </div>
        <div className="flex items-center gap-3">
          {combo > 1 && <span className="flex items-center gap-1 text-xs font-semibold text-theme-accent" aria-label={`${combo} times combo`}><Flame className="w-4 h-4" />{combo}×</span>}
          <div className="text-right"><p className="text-xl font-semibold tabular-nums text-theme-accent">{score}<span className="text-[11px] ml-1 font-normal">pts</span></p><p className="text-[11px] text-theme-text-muted">Best {highScore}</p></div>
          <button type="button" onClick={() => { soundFx.playKey(); onSkipWord(); }} className="min-h-10 px-2.5 rounded-lg border border-theme-border text-theme-text-secondary hover:bg-theme-bg-secondary text-xs font-medium flex items-center gap-1.5 btn-press" title="Skip puzzle: lose 5 seconds and reset combo" aria-label="Skip puzzle, costs 5 seconds">
            <FastForward className="w-4 h-4" /><span>Skip <span className="text-theme-text-muted">−5s</span></span>
          </button>
        </div>
      </div>
      <div className="w-full h-1.5 mt-3 bg-theme-bg-secondary rounded-full overflow-hidden" role="progressbar" aria-label="Time remaining" aria-valuemin={0} aria-valuemax={totalTime} aria-valuenow={safeTime}>
        <div className={`h-full transition-all duration-300 rounded-full ${timerColor}`} style={{ width: `${percentLeft}%` }} />
      </div>
    </section>
  );
};
