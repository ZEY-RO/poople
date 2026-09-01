import React, { useRef, useEffect } from 'react';
import { Step } from '../types/game';
import { getWordDefinition } from '../data/dictionary';
import { HelpCircle, RotateCcw, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { soundFx } from '../services/audio';

interface LadderBoardProps {
  startWord: string;
  targetWord: string;
  history: Step[];
  currentInput: string;
  isWon: boolean;
  par: number;
  errorMessage: string | null;
  isShaking: boolean;
  onSelectWordDefinition: (word: string, def: string) => void;
  onRewindToStep?: (index: number) => void;
  showDeadEndRadar?: boolean;
  isDeadEnd?: boolean;
  hardMode?: boolean;
}

export const LadderBoard: React.FC<LadderBoardProps> = ({
  startWord,
  targetWord,
  history,
  currentInput,
  isWon,
  par,
  errorMessage,
  isShaking,
  onSelectWordDefinition,
  onRewindToStep,
  showDeadEndRadar = true,
  isDeadEnd = false,
  hardMode = false
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom as ladder grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [history.length, currentInput]);

  const currentStepCount = history.length;
  const isOverPar = currentStepCount > par;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 flex flex-col items-center">
      {/* Top Par and Steps Metric Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-3 py-2 bg-theme-bg-secondary border border-theme-border/60 rounded-xl text-xs sm:text-sm font-semibold shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-theme-text-muted">Par:</span>
          <span className="px-2 py-0.5 rounded-md bg-theme-accent/15 text-theme-accent border border-theme-accent/30 font-black">
            {par} steps
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-theme-text-muted">Steps Taken:</span>
          <span className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
            isOverPar
              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
          }`}>
            {currentStepCount}
          </span>
        </div>

        {/* Dead End Warning Radar */}
        {showDeadEndRadar && !isWon && (
          <div className="flex items-center gap-1">
            {isDeadEnd ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Dead End
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Solvable
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ladder Column */}
      <div className="w-full space-y-2 max-h-[46vh] sm:max-h-[50vh] overflow-y-auto px-1 py-1 custom-scrollbar">
        {/* Row 0: Start Word */}
        <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-theme-bg-secondary/70 border border-theme-border/60">
          <div className="w-12 text-center text-[10px] sm:text-xs font-black text-theme-accent uppercase tracking-wider">
            START
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {startWord.split('').map((char, idx) => (
              <div
                key={idx}
                className="w-11 h-12 sm:w-13 sm:h-14 flex items-center justify-center font-display font-black text-xl sm:text-2xl rounded-xl bg-theme-tile-start-bg text-theme-tile-start-text shadow-sm border-2 border-theme-tile-start-border select-none"
              >
                {char}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              soundFx.playKey();
              onSelectWordDefinition(startWord, getWordDefinition(startWord));
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-secondary transition-colors btn-press"
            title="View definition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* History Steps */}
        {history.map((step, stepIndex) => {
          const isTarget = step.word === targetWord;
          return (
            <div
              key={stepIndex}
              className={`flex items-center justify-between gap-2 p-1 rounded-xl transition-all animate-pop ${
                isTarget
                  ? 'bg-theme-tile-correct-bg/20 border-2 border-theme-tile-correct-border glow-theme'
                  : 'bg-theme-bg-card border border-theme-border/60 shadow-sm'
              }`}
            >
              <div className="w-12 text-center text-xs font-bold text-theme-text-muted">
                #{stepIndex + 1}
              </div>

              <div className="flex gap-1.5 sm:gap-2">
                {step.word.split('').map((char, charIdx) => {
                  const isChanged = step.changedIndex === charIdx;
                  return (
                    <div
                      key={charIdx}
                      className={`w-11 h-12 sm:w-13 sm:h-14 flex items-center justify-center font-display font-black text-xl sm:text-2xl rounded-xl shadow-sm border-2 transition-all select-none ${
                        isTarget
                          ? 'bg-theme-tile-correct-bg text-theme-tile-correct-text border-theme-tile-correct-border glow-theme'
                          : isChanged
                          ? 'bg-theme-tile-diff-bg text-theme-tile-diff-text border-theme-tile-diff-border scale-105 shadow-md'
                          : 'bg-theme-tile-empty text-theme-tile-empty-text border-theme-tile-border'
                      }`}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => {
                    soundFx.playKey();
                    onSelectWordDefinition(step.word, getWordDefinition(step.word));
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-secondary transition-colors btn-press"
                  title="View definition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>

                {!hardMode && !isWon && onRewindToStep && stepIndex < history.length - 1 && (
                  <button
                    onClick={() => {
                      soundFx.playUndo();
                      onRewindToStep(stepIndex);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-theme-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors btn-press"
                    title="Rewind back to this step"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Current Active Typing Row (if not yet won) */}
        {!isWon && (
          <div
            className={`flex items-center justify-between gap-2 p-1 rounded-xl bg-theme-bg-secondary/40 border-2 border-dashed border-theme-accent/60 ${
              isShaking ? 'animate-shake border-rose-500 bg-rose-500/10' : ''
            }`}
          >
            <div className="w-12 text-center text-xs font-bold text-theme-accent animate-pulse">
              #{history.length + 1}
            </div>

            <div className="flex gap-1.5 sm:gap-2">
              {[0, 1, 2, 3].map(idx => {
                const char = currentInput[idx] || '';
                const isCurrentCursor = currentInput.length === idx;
                return (
                  <div
                    key={idx}
                    className={`w-11 h-12 sm:w-13 sm:h-14 flex items-center justify-center font-display font-black text-xl sm:text-2xl rounded-xl border-2 transition-all select-none ${
                      char
                        ? 'bg-theme-tile-active-bg text-theme-tile-active-text border-theme-tile-active-border scale-100'
                        : isCurrentCursor
                        ? 'bg-theme-bg-card border-theme-accent ring-2 ring-theme-accent/30 scale-105 animate-pulse'
                        : 'bg-theme-bg-card/40 border-theme-border/40'
                    }`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>

            <div className="w-7 h-7" />
          </div>
        )}

        {/* Target Row at Bottom (Goal POOP) */}
        {!isWon && (
          <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-theme-bg-secondary/30 border border-dashed border-theme-border/60 opacity-85">
            <div className="w-12 text-center text-[10px] sm:text-xs font-black text-theme-accent flex items-center justify-center gap-0.5 uppercase tracking-wider">
              <Lock className="w-3 h-3 inline text-theme-accent" />
              GOAL
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {targetWord.split('').map((char, idx) => (
                <div
                  key={idx}
                  className="w-11 h-12 sm:w-13 sm:h-14 flex items-center justify-center font-display font-black text-xl sm:text-2xl rounded-xl bg-theme-bg-secondary/50 text-theme-text-muted border-2 border-dashed border-theme-border/60 select-none"
                >
                  {char}
                </div>
              ))}
            </div>
            <div className="w-7 h-7" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-500/30 flex items-center gap-1.5 animate-bounceShort">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
