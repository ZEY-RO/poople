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
      <div className="w-full flex items-center justify-between mb-3 px-3 py-2 bg-amber-100/60 dark:bg-slate-800/80 backdrop-blur rounded-xl text-xs sm:text-sm font-semibold border border-amber-200/50 dark:border-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 dark:text-stone-400">Par:</span>
          <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 font-bold">
            {par} steps
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 dark:text-stone-400">Steps Taken:</span>
          <span className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
            isOverPar
              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
          }`}>
            {currentStepCount}
          </span>
        </div>

        {/* Dead End Warning Radar */}
        {showDeadEndRadar && !isWon && (
          <div className="flex items-center gap-1">
            {isDeadEnd ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Dead End
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
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
        <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-amber-200/40 dark:bg-slate-800/40 border border-amber-300/40 dark:border-slate-700/60">
          <div className="w-12 text-center text-[10px] sm:text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
            START
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {startWord.split('').map((char, idx) => (
              <div
                key={idx}
                className="w-11 h-12 sm:w-13 sm:h-14 flex items-center justify-center font-display font-black text-xl sm:text-2xl rounded-xl bg-white dark:bg-slate-700 text-amber-950 dark:text-amber-100 shadow-sm border-2 border-amber-300 dark:border-amber-500/30 select-none"
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
            className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-700/60 dark:text-amber-400/60 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-slate-700 btn-press"
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
                  ? 'bg-amber-400/30 dark:bg-amber-500/20 border-2 border-amber-400 dark:border-amber-400'
                  : 'bg-white/80 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-700'
              }`}
            >
              <div className="w-12 text-center text-xs font-bold text-stone-500 dark:text-stone-400">
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
                          ? 'bg-amber-400 text-amber-950 border-amber-500 dark:bg-amber-500 dark:text-stone-900 animate-glow'
                          : isChanged
                          ? 'bg-amber-500 text-white border-amber-600 dark:bg-amber-500 dark:text-stone-950 scale-105 shadow-md shadow-amber-500/30'
                          : 'bg-amber-50 dark:bg-slate-700/90 text-stone-800 dark:text-stone-100 border-amber-200/70 dark:border-slate-600'
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
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-slate-700 btn-press"
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
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-slate-700 btn-press"
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
            className={`flex items-center justify-between gap-2 p-1 rounded-xl bg-amber-300/20 dark:bg-slate-800/60 border-2 border-dashed border-amber-400/80 dark:border-amber-500/50 ${
              isShaking ? 'animate-shake border-rose-500 bg-rose-100/30' : ''
            }`}
          >
            <div className="w-12 text-center text-xs font-bold text-amber-700 dark:text-amber-400 animate-pulse">
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
                        ? 'bg-amber-100 dark:bg-slate-700 text-stone-900 dark:text-white border-amber-400 dark:border-amber-400 scale-100'
                        : isCurrentCursor
                        ? 'bg-white dark:bg-slate-800 border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/40 scale-105 animate-pulse'
                        : 'bg-white/60 dark:bg-slate-800/40 border-stone-300 dark:border-slate-700'
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
          <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-400/40 dark:border-amber-500/20 opacity-85">
            <div className="w-12 text-center text-[10px] sm:text-xs font-black text-amber-700 dark:text-amber-400 flex items-center justify-center gap-0.5 uppercase tracking-wider">
              <Lock className="w-3 h-3 inline text-amber-600" />
              GOAL
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {targetWord.split('').map((char, idx) => (
                <div
                  key={idx}
                  className="w-11 h-12 sm:w-13 sm:h-14 flex items-center justify-center font-display font-black text-xl sm:text-2xl rounded-xl bg-amber-100/50 dark:bg-slate-800 text-amber-900/60 dark:text-amber-300/60 border-2 border-dashed border-amber-300 dark:border-slate-700 select-none"
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
