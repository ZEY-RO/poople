import React from 'react';
import { ArrowDown, Keyboard, Lightbulb, X } from 'lucide-react';
import { Modal } from './Modal';

interface TutorialModalProps { onClose: () => void; }

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => (
  <Modal label="How to play Poople" onClose={onClose}>
    <div className="bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[90dvh]">
      <div className="p-5 border-b border-theme-border flex items-start justify-between gap-3">
        <div><h2 className="text-xl font-display font-bold">Small changes. Big flush.</h2><p className="text-sm text-theme-text-muted mt-1">Your guide to the word ladder.</p></div>
        <button onClick={onClose} aria-label="Close how to play" className="p-2 rounded-xl text-theme-text-muted hover:bg-theme-bg-secondary"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5 overflow-y-auto space-y-5">
        <p className="text-sm leading-relaxed text-theme-text-secondary">Turn the starting word into <strong className="text-theme-text-primary">POOP</strong>, one letter at a time. Every step must be a four-letter word in the game dictionary.</p>
        <div className="rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border p-4 flex flex-col items-center gap-2">
          {['POLL', 'POOL', 'POOP'].map((word, index) => <React.Fragment key={word}>{index > 0 && <ArrowDown className="w-4 h-4 text-theme-text-muted" />}<div className="flex gap-2">{word.split('').map((letter, letterIndex) => <span key={letterIndex} className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl font-mono font-bold ${index === 2 ? 'bg-theme-tile-correct-bg text-theme-tile-correct-text border-theme-tile-correct-border' : (index === 1 && letterIndex === 2) ? 'bg-theme-tile-diff-bg text-theme-tile-diff-text border-theme-tile-diff-border' : 'bg-theme-bg-card text-theme-text-primary border-theme-border'}`}>{letter}</span>)}</div></React.Fragment>)}
          <p className="text-xs text-theme-text-muted mt-2">Change exactly one letter. Keep its position.</p>
        </div>
        <div className="flex gap-3"><Keyboard className="w-5 h-5 shrink-0 text-theme-accent" /><div><h3 className="text-sm font-bold">Type it. Submit it.</h3><p className="text-sm text-theme-text-secondary leading-relaxed mt-1">Use your keyboard or the keys on screen. Press Enter to submit. Backspace removes a letter.</p></div></div>
        <div className="flex gap-3"><Lightbulb className="w-5 h-5 shrink-0 text-theme-accent" /><div><h3 className="text-sm font-bold">Find your way</h3><p className="text-sm text-theme-text-secondary leading-relaxed mt-1">Par is the fewest possible moves. Need a nudge? Hint gives a clue; Peek shows valid next words. Undo lets you try a new route.</p></div></div>
        <p className="text-xs text-theme-text-muted leading-relaxed">Tap the information icon beside a word to see its meaning. Custom puzzles can have a different target word.</p>
      </div>
      <div className="p-5 border-t border-theme-border"><button onClick={onClose} className="w-full rounded-xl py-3 bg-theme-accent text-theme-accent-text font-bold text-sm">Let’s play</button></div>
    </div>
  </Modal>
);
