import React, { useRef, useEffect } from 'react';
import { Step } from '../types/game';
import { getWordDefinition } from '../data/dictionary';
import { Info, RotateCcw, AlertCircle, Check, Lock } from 'lucide-react';

interface LadderBoardProps {
  startWord: string;
  targetWord: string;
  history: Step[];
  currentInput: string;
  isWon: boolean;
  disabled?: boolean;
  par: number;
  errorMessage: string | null;
  isShaking: boolean;
  onSelectWordDefinition: (word: string, def: string) => void;
  onRewindToStep?: (index: number) => void;
  onInputChange: (value: string) => void;
  onSubmitWord: () => void;
  showDeadEndRadar?: boolean;
  isDeadEnd?: boolean;
  hardMode?: boolean;
}

export const LadderBoard: React.FC<LadderBoardProps> = ({ startWord, targetWord, history, currentInput, isWon, disabled = false, par, errorMessage, isShaking, onSelectWordDefinition, onRewindToStep, onInputChange, onSubmitWord, showDeadEndRadar = true, isDeadEnd = false, hardMode = false }) => {
  const activeRowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Keep new steps visible within the ladder without moving the whole page.
  useEffect(() => {
    if (scrollRef.current && activeRowRef.current) {
      const container = scrollRef.current;
      const row = activeRowRef.current;
      container.scrollTop = Math.max(0, row.offsetTop - container.clientHeight + row.clientHeight + 12);
    }
  }, [history.length]);

  const tiles = (word: string, kind: string, changedIndex?: number | null) => <div className="letter-row" aria-label={word}>{word.split('').map((char, idx) => <span key={idx} className={`letter-tile ${kind} ${changedIndex === idx ? 'changed' : ''}`}>{char}</span>)}</div>;
  const definition = (word: string) => <button onClick={() => onSelectWordDefinition(word, getWordDefinition(word))} title={`Definition of ${word}`} aria-label={`Definition of ${word}`}><Info size={14} /></button>;

  return (
    <div className="w-full mx-auto">
      <div className="board-metrics">
        <span>YOUR MOVES<strong>{history.length.toString().padStart(2, '0')}</strong></span>
        <span>PAR<strong>{par} moves</strong></span>
        {showDeadEndRadar && <span className={`inline-flex items-center gap-1 ${isDeadEnd ? 'text-rose-600' : 'text-theme-accent'}`}>{isDeadEnd ? <AlertCircle size={12} /> : <Check size={12} />}{isWon ? 'Complete' : isDeadEnd ? 'Dead end' : 'Path possible'}</span>}
      </div>
      <div className="ladder-scroll relative" ref={scrollRef} role="log" aria-label="Your word ladder" aria-live="polite" aria-relevant="additions">
        <div className="ladder-row"><span className="row-label">Start</span>{tiles(startWord, 'start')}<div className="row-actions">{definition(startWord)}</div></div>
        {history.map((step, index) => <div key={index} className="ladder-row animate-pop"><span className="row-label">{String(index + 1).padStart(2, '0')}</span>{tiles(step.word, '', step.changedIndex)}<div className="row-actions">{definition(step.word)}{!hardMode && !disabled && index < history.length - 1 && <button onClick={() => onRewindToStep?.(index)} aria-label={`Rewind to ${step.word}`} title={`Rewind to ${step.word}`}><RotateCcw size={12} /></button>}</div></div>)}
        {!isWon && !disabled && <div ref={activeRowRef} className={`ladder-row ${isShaking ? 'animate-shake' : ''}`}>
          <span className="row-label text-theme-accent">Next</span>
          <div className="word-entry relative min-w-0">
            <div className="letter-row" aria-hidden="true">{[0,1,2,3].map(idx => <span key={idx} className={`letter-tile ${currentInput[idx] ? 'active' : ''} ${currentInput.length === idx ? 'cursor' : ''}`}>{currentInput[idx] || ''}</span>)}</div>
            <input className="absolute inset-0 w-full h-full opacity-0 cursor-text" aria-label="Next word" aria-describedby="input-helper" aria-invalid={Boolean(errorMessage)} value={currentInput} onChange={e => onInputChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && !e.repeat) { e.preventDefault(); e.stopPropagation(); onSubmitWord(); } }} maxLength={4} autoComplete="off" autoCapitalize="characters" autoCorrect="off" spellCheck={false} inputMode="text" />
          </div>
          <div />
        </div>}
        {!isWon && <div className="ladder-row mt-4"><span className="row-label inline-flex items-center gap-1"><Lock size={9} /> Goal</span>{tiles(targetWord, 'goal')}<div /></div>}
      </div>
      <div id="input-helper" className="input-helper" role={errorMessage ? 'alert' : 'status'}>{errorMessage ? <span className="inline-flex gap-1.5 items-center text-rose-600"><AlertCircle size={12} />{errorMessage}</span> : isWon ? 'Nicely done. You found your way!' : disabled ? 'Your next word adventure is ready when you are.' : currentInput.length === 4 ? 'Looking good? Press Enter to try your word.' : 'Type a four-letter word, changing just one letter.'}</div>
    </div>
  );
};
