import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Copy, Play, X, AlertTriangle } from 'lucide-react';
import { findShortestPath } from '../engine/solver';
import { WORD_SET } from '../data/dictionary';
import { soundFx } from '../services/audio';
import { copyText } from '../services/clipboard';
import { Modal } from './Modal';

interface CustomPuzzleModalProps {
  initialStartWord?: string;
  initialTargetWord?: string;
  onStartCustomPuzzle: (startWord: string, targetWord: string, par: number, path: string[]) => void;
  onClose: () => void;
}

export const CustomPuzzleModal: React.FC<CustomPuzzleModalProps> = ({ onStartCustomPuzzle, onClose, initialStartWord = 'CHAT', initialTargetWord = 'POOP' }) => {
  const [startWord, setStartWord] = useState(() => initialStartWord.toUpperCase());
  const [targetWord, setTargetWord] = useState(() => initialTargetWord.toUpperCase());
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [showSolution, setShowSolution] = useState(false);
  const validStart = startWord.length === 4 && WORD_SET.has(startWord);
  const validTarget = targetWord.length === 4 && WORD_SET.has(targetWord);
  const path = useMemo(() => validStart && validTarget && startWord !== targetWord
    ? findShortestPath(startWord, targetWord) : null, [startWord, targetWord, validStart, validTarget]);
  const par = path ? path.length - 1 : 0;

  useEffect(() => {
    setCopyStatus('idle');
    setShowSolution(false);
  }, [startWord, targetWord]);

  const handlePlay = () => {
    if (!path || par < 1) return;
    soundFx.playFlush();
    onStartCustomPuzzle(startWord, targetWord, par, path);
    onClose();
  };

  const handleCopy = async () => {
    if (!path) return;
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('start', startWord);
    url.searchParams.set('target', targetWord);
    setCopyStatus(await copyText(url.toString()) ? 'copied' : 'failed');
  };

  let feedback = 'Enter two four-letter dictionary words to check your puzzle.';
  if (startWord.length === 4 && !validStart) feedback = `${startWord} is not in the game dictionary.`;
  else if (targetWord.length === 4 && !validTarget) feedback = `${targetWord} is not in the game dictionary.`;
  else if (validStart && validTarget && startWord === targetWord) feedback = 'Choose different start and target words.';
  else if (validStart && validTarget && !path) feedback = 'These words are disconnected. Try a different pair.';

  return (
    <Modal label="Create a custom puzzle" onClose={onClose}>
      <form onSubmit={event => { event.preventDefault(); handlePlay(); }} className="w-full bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="p-5 border-b border-theme-border flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-display font-bold">Make it your own</h2>
            <p className="text-sm text-theme-text-muted mt-1">Build a word ladder. Challenge a friend.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close custom puzzle" className="p-2 rounded-xl text-theme-text-muted hover:bg-theme-bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <label htmlFor="custom-start" className="text-xs font-bold text-theme-text-secondary block mb-2">Start word</label>
              <input id="custom-start" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={4} value={startWord} onChange={event => setStartWord(event.target.value.replace(/[^a-z]/gi, '').toUpperCase())} aria-invalid={startWord.length === 4 && !validStart} aria-describedby="custom-feedback" className="w-full min-w-0 px-2 py-3 rounded-xl border border-theme-border bg-theme-bg-secondary text-theme-text-primary font-mono font-bold text-xl text-center tracking-widest focus:ring-2 focus:ring-theme-accent outline-none" />
            </div>
            <ArrowRight className="w-4 h-4 text-theme-text-muted mt-6" />
            <div>
              <label htmlFor="custom-target" className="text-xs font-bold text-theme-text-secondary block mb-2">Target word</label>
              <input id="custom-target" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={4} value={targetWord} onChange={event => setTargetWord(event.target.value.replace(/[^a-z]/gi, '').toUpperCase())} aria-invalid={targetWord.length === 4 && !validTarget} aria-describedby="custom-feedback" className="w-full min-w-0 px-2 py-3 rounded-xl border border-theme-border bg-theme-bg-secondary text-theme-text-primary font-mono font-bold text-xl text-center tracking-widest focus:ring-2 focus:ring-theme-accent outline-none" />
            </div>
          </div>
          <div id="custom-feedback" role="status" className="p-4 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border text-sm">
            {path ? <>
              <div className="font-semibold flex items-center gap-2 text-theme-text-primary"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Ready to play · {par} {par === 1 ? 'move' : 'moves'} at par</div>
              <button type="button" onClick={() => setShowSolution(value => !value)} className="text-xs text-theme-accent font-semibold mt-3 underline underline-offset-4">{showSolution ? 'Hide solution' : 'Preview shortest solution'}</button>
              {showSolution && <p className="text-xs font-mono text-theme-text-secondary mt-3 leading-relaxed break-words">{path.join(' → ')}</p>}
            </> : <div className="text-theme-text-secondary flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{feedback}</div>}
          </div>
          <p role="status" className="sr-only">{copyStatus === 'copied' ? 'Puzzle link copied to the clipboard.' : ''}</p>
          {copyStatus === 'failed' && <p role="alert" className="text-xs text-rose-600">Copying is unavailable in this browser. Play the puzzle, then copy its address from your browser.</p>}
        </div>
        <div className="p-5 bg-theme-modal-subcard border-t border-theme-border flex gap-3">
          <button type="button" disabled={!path} onClick={handleCopy} className="flex-1 py-3 px-3 rounded-xl bg-theme-bg-card text-theme-text-primary border border-theme-border font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40">{copyStatus === 'copied' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copyStatus === 'copied' ? 'Link copied' : 'Copy link'}</button>
          <button type="submit" disabled={!path} className="flex-1 py-3 px-3 rounded-xl bg-theme-accent text-theme-accent-text font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"><Play className="w-4 h-4" />Play puzzle</button>
        </div>
      </form>
    </Modal>
  );
};
