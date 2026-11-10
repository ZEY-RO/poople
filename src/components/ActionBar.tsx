import React, { useEffect, useState } from 'react';
import { Lightbulb, RotateCcw, RefreshCw, Shuffle, Eye, X, ArrowRight } from 'lucide-react';
import { soundFx } from '../services/audio';
import { getOptimalHint, getNeighborEvaluations } from '../engine/solver';
import { getWordDefinition } from '../data/dictionary';

interface ActionBarProps {
  currentWord: string;
  targetWord: string;
  historyLength: number;
  isWon: boolean;
  hardMode?: boolean;
  canReset?: boolean;
  isUnlimitedMode?: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onNewRandomWord?: () => void;
  onApplyHintWord?: (word: string) => void;
  onHintUsed?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ currentWord, targetWord, historyLength, isWon, canReset = true, hardMode = false, isUnlimitedMode = false, onUndo, onRestart, onNewRandomWord, onApplyHintWord, onHintUsed }) => {
  const [hintLevel, setHintLevel] = useState(0);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [showNeighbors, setShowNeighbors] = useState(false);
  useEffect(() => { setHintLevel(0); setHintMessage(null); setShowNeighbors(false); }, [currentWord, targetWord]);
  const handleHint = () => {
    const hint = getOptimalHint(currentWord, targetWord);
    if (!hint) { setHintMessage('No route from here. Try undoing your last step.'); return; }
    soundFx.playHint();
    onHintUsed?.();
    const level = hintLevel + 1;
    setHintLevel(level);
    if (level === 1) setHintMessage(`Try changing the ${['first', 'second', 'third', 'fourth'][hint.changedIndex]} letter.`);
    else if (level === 2) setHintMessage(`A clue for the next word: ${getWordDefinition(hint.nextWord)}`);
    else { setHintMessage(`Try ${hint.nextWord}. It's filled in — press Enter when you're ready.`); onApplyHintWord?.(hint.nextWord); }
  };
  const neighbors = showNeighbors ? getNeighborEvaluations(currentWord, targetWord) : [];
  return <div className="w-full mx-auto py-2">
    {hintMessage && !isWon && <div className="flex items-start gap-2 bg-theme-accent-light border border-theme-border rounded-xl p-3 mb-3 text-xs text-theme-text-secondary" role="status"><Lightbulb size={15} className="shrink-0 text-theme-accent" /><p className="flex-1 leading-relaxed">{hintMessage}</p><button aria-label="Dismiss hint" onClick={() => setHintMessage(null)}><X size={14} /></button></div>}
    <div className="flex gap-2">
      <button disabled={isWon} onClick={handleHint} className="action-button hint"><Lightbulb size={14} />Hint</button>
      {!hardMode && <button disabled={isWon || historyLength === 0} onClick={() => { soundFx.playUndo(); onUndo(); }} className="action-button"><RotateCcw size={14} />Undo</button>}
      <button disabled={!canReset || historyLength === 0} onClick={onRestart} className="action-button" title="Restart this ladder"><RefreshCw size={14} />Reset</button>
      <button disabled={isWon} aria-expanded={showNeighbors} onClick={() => { setShowNeighbors(!showNeighbors); if (!showNeighbors) onHintUsed?.(); }} className="action-button" title="Explore legal next words"><Eye size={14} />Moves</button>
      {isUnlimitedMode && <button className="action-button hint" onClick={onNewRandomWord} title="Start a new random puzzle"><Shuffle size={14} />New</button>}
    </div>
    {showNeighbors && !isWon && <section className="p-3 mt-3 rounded-xl bg-theme-bg-muted border border-theme-border">
      <div className="flex items-center justify-between mb-2"><h3 className="text-xs font-semibold">Next words from {currentWord}</h3><button onClick={() => setShowNeighbors(false)} aria-label="Close legal moves"><X size={14} /></button></div>
      <p className="text-[10px] text-theme-text-muted mb-3">Select a word to fill it in. Highlighted words take the shortest route.</p>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">{neighbors.length ? neighbors.map(n => <button key={n.word} className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-mono border ${n.isOptimal ? 'bg-theme-accent text-theme-accent-text border-theme-accent' : 'bg-theme-bg-card text-theme-text-secondary border-theme-border'}`} onClick={() => { onApplyHintWord?.(n.word); setShowNeighbors(false); }} title={n.distanceToTarget === null ? 'No path to goal' : `${n.distanceToTarget} moves to goal`}>{n.word}{n.isOptimal && <ArrowRight size={10} />}</button>) : <p className="text-xs text-theme-text-muted">No legal next words. Undo a step to try another route.</p>}</div>
    </section>}
  </div>;
};
