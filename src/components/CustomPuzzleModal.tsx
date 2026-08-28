import React, { useState } from 'react';
import { PlusCircle, Sparkles, Check, Copy, Play, X, AlertTriangle } from 'lucide-react';
import { findShortestPath } from '../engine/solver';
import { WORD_SET } from '../data/dictionary';
import { soundFx } from '../services/audio';

interface CustomPuzzleModalProps {
  onStartCustomPuzzle: (startWord: string, targetWord: string, par: number, path: string[]) => void;
  onClose: () => void;
}

export const CustomPuzzleModal: React.FC<CustomPuzzleModalProps> = ({
  onStartCustomPuzzle,
  onClose
}) => {
  const [startWord, setStartWord] = useState<string>('CHAT');
  const [targetWord, setTargetWord] = useState<string>('POOP');
  const [copied, setCopied] = useState<boolean>(false);

  const cleanStart = startWord.toUpperCase().trim();
  const cleanTarget = targetWord.toUpperCase().trim();

  const isStartValid = cleanStart.length === 4 && WORD_SET.has(cleanStart);
  const isTargetValid = cleanTarget.length === 4 && WORD_SET.has(cleanTarget);

  let path: string[] | null = null;
  let par = -1;

  if (isStartValid && isTargetValid && cleanStart !== cleanTarget) {
    path = findShortestPath(cleanStart, cleanTarget);
    if (path) par = path.length - 1;
  }

  const handleCopyLink = async () => {
    soundFx.playKey();
    const url = `${window.location.origin}${window.location.pathname}?start=${cleanStart}&target=${cleanTarget}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlay = () => {
    if (path && par > 0) {
      soundFx.playFlush();
      onStartCustomPuzzle(cleanStart, cleanTarget, par, path);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-amber-950 dark:text-amber-300 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-500" />
            Custom Puzzle Builder
          </h2>
          <button
            onClick={() => {
              soundFx.playKey();
              onClose();
            }}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Starting Word (4 Letters)
            </label>
            <input
              type="text"
              maxLength={4}
              value={startWord}
              onChange={e => setStartWord(e.target.value.toUpperCase())}
              placeholder="e.g. CHAT"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-mono font-black text-lg text-center tracking-widest uppercase focus:ring-2 focus:ring-amber-500 outline-none"
            />
            {!isStartValid && cleanStart.length === 4 && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                Not a recognized dictionary word.
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Target Word (Default: POOP)
            </label>
            <input
              type="text"
              maxLength={4}
              value={targetWord}
              onChange={e => setTargetWord(e.target.value.toUpperCase())}
              placeholder="e.g. POOP"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-mono font-black text-lg text-center tracking-widest uppercase focus:ring-2 focus:ring-amber-500 outline-none"
            />
            {!isTargetValid && cleanTarget.length === 4 && (
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                Not a recognized dictionary word.
              </span>
            )}
          </div>

          {/* Solvability Preview Card */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-center">
            {path ? (
              <div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Solvable in {par} Steps (Par: {par})
                </div>
                <div className="text-[11px] font-mono text-stone-500 mt-1 truncate">
                  Optimal: {path.join(' ➔ ')}
                </div>
              </div>
            ) : (
              <div className="text-xs font-bold text-rose-500 flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {cleanStart === cleanTarget ? 'Start and target must differ' : 'No path exists between these words'}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 dark:bg-slate-800/80 border-t border-stone-200 dark:border-slate-700 flex gap-2">
          <button
            disabled={!path}
            onClick={handleCopyLink}
            className="flex-1 py-3 px-3 rounded-2xl bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 btn-press disabled:opacity-40"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
          </button>

          <button
            disabled={!path}
            onClick={handlePlay}
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/30 flex items-center justify-center gap-1.5 btn-press disabled:opacity-40"
          >
            <Play className="w-4 h-4" />
            <span>Play Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
