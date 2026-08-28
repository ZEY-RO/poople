import React, { useState } from 'react';
import { Lightbulb, RotateCcw, RefreshCw, Shuffle, Eye } from 'lucide-react';
import { soundFx } from '../services/audio';
import { getOptimalHint, getNeighborEvaluations } from '../engine/solver';
import { getWordDefinition } from '../data/dictionary';

interface ActionBarProps {
  currentWord: string;
  targetWord: string;
  historyLength: number;
  isWon: boolean;
  hardMode?: boolean;
  isUnlimitedMode?: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onNewRandomWord?: () => void;
  onApplyHintWord?: (word: string) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  currentWord,
  targetWord,
  historyLength,
  isWon,
  hardMode = false,
  isUnlimitedMode = false,
  onUndo,
  onRestart,
  onNewRandomWord,
  onApplyHintWord
}) => {
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [showNeighborsSheet, setShowNeighborsSheet] = useState<boolean>(false);

  const handleHintClick = () => {
    soundFx.playHint();
    const hint = getOptimalHint(currentWord, targetWord);

    if (!hint) {
      setHintMessage("You've hit a dead end! Try undoing a step.");
      return;
    }

    const nextLvl = hintLevel + 1;
    setHintLevel(nextLvl);

    if (nextLvl === 1) {
      const positionNames = ['1st', '2nd', '3rd', '4th'];
      setHintMessage(`💡 Hint 1: Change the ${positionNames[hint.changedIndex]} letter next.`);
    } else if (nextLvl === 2) {
      const def = getWordDefinition(hint.nextWord);
      setHintMessage(`💡 Hint 2 (Clue): "${def}"`);
    } else {
      setHintMessage(`💡 Hint 3 (Reveal): Try "${hint.nextWord}"!`);
      if (onApplyHintWord) {
        onApplyHintWord(hint.nextWord);
      }
    }
  };

  const neighbors = showNeighborsSheet ? getNeighborEvaluations(currentWord, targetWord) : [];

  return (
    <div className="w-full max-w-md mx-auto px-4 py-1.5 flex flex-col items-center">
      {/* Hint Alert Bubble */}
      {hintMessage && !isWon && (
        <div className="w-full mb-2 px-3 py-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between animate-pop">
          <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis">
            <span>{hintMessage}</span>
          </div>
          <button
            onClick={() => setHintMessage(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Buttons Grid */}
      <div className="w-full flex items-center justify-between gap-2">
        {/* Hint Button */}
        <button
          disabled={isWon}
          onClick={handleHintClick}
          className="flex-1 py-2 px-2.5 rounded-xl bg-amber-100/90 dark:bg-slate-800 text-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm border border-amber-200/60 dark:border-slate-700 btn-press disabled:opacity-50"
          title="Get a helpful hint"
        >
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Hint</span>
        </button>

        {/* Undo Button (disabled if hard mode or no steps) */}
        {!hardMode && (
          <button
            disabled={isWon || historyLength === 0}
            onClick={() => {
              soundFx.playUndo();
              onUndo();
              setHintMessage(null);
              setHintLevel(0);
            }}
            className="flex-1 py-2 px-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm border border-stone-200 dark:border-slate-700 btn-press disabled:opacity-40"
            title="Undo last move"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Undo</span>
          </button>
        )}

        {/* Restart Button */}
        <button
          disabled={historyLength === 0}
          onClick={() => {
            soundFx.playKey();
            onRestart();
            setHintMessage(null);
            setHintLevel(0);
          }}
          className="flex-1 py-2 px-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm border border-stone-200 dark:border-slate-700 btn-press disabled:opacity-40"
          title="Restart ladder from beginning"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        {/* Peek Neighbors Button */}
        <button
          onClick={() => {
            soundFx.playKey();
            setShowNeighborsSheet(!showNeighborsSheet);
          }}
          className="py-2 px-2.5 rounded-xl bg-sky-100/90 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/60 font-bold text-xs flex items-center justify-center gap-1 shadow-sm border border-sky-200 dark:border-sky-800 btn-press"
          title="View all legal moves from current word"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Peek</span>
        </button>

        {/* New Random Word Button (in unlimited mode) */}
        {isUnlimitedMode && onNewRandomWord && (
          <button
            onClick={() => {
              soundFx.playFlush();
              onNewRandomWord();
              setHintMessage(null);
              setHintLevel(0);
            }}
            className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 btn-press"
            title="Roll a new random puzzle"
          >
            <Shuffle className="w-4 h-4" />
            <span>New</span>
          </button>
        )}
      </div>

      {/* Neighbors Peek Sheet Drawer */}
      {showNeighborsSheet && (
        <div className="w-full mt-2.5 p-3 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-xl border border-stone-200 dark:border-slate-700 animate-pop">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Legal Next Moves from <span className="text-amber-600 dark:text-amber-400 font-extrabold">{currentWord}</span> ({neighbors.length})
            </span>
            <button
              onClick={() => setShowNeighborsSheet(false)}
              className="text-xs text-stone-400 hover:text-stone-600 font-bold"
            >
              ✕ Close
            </button>
          </div>
          <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5 custom-scrollbar">
            {neighbors.map(n => (
              <button
                key={n.word}
                onClick={() => {
                  soundFx.playKey();
                  if (onApplyHintWord) onApplyHintWord(n.word);
                  setShowNeighborsSheet(false);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all btn-press ${
                  n.isOptimal
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                    : n.distanceToTarget !== null
                    ? 'bg-amber-50 dark:bg-slate-700 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-slate-600'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-300'
                }`}
                title={n.isOptimal ? 'Optimal Step!' : n.distanceToTarget !== null ? `${n.distanceToTarget} steps away` : 'Dead End'}
              >
                {n.word} {n.isOptimal && '✨'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
