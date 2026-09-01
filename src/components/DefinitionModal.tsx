import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { soundFx } from '../services/audio';

interface DefinitionModalProps {
  word: string;
  definition: string;
  onClose: () => void;
}

export const DefinitionModal: React.FC<DefinitionModalProps> = ({
  word,
  definition,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-sm bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden p-5 text-center relative">
        <button
          onClick={() => {
            soundFx.playKey();
            onClose();
          }}
          className="absolute top-4 right-4 p-1 rounded-xl text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-secondary btn-press"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-theme-bg-secondary text-theme-accent border border-theme-border/60 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-display font-black text-theme-text-primary tracking-wider">
          {word.toUpperCase()}
        </h2>
        <span className="text-[11px] font-bold text-theme-text-muted uppercase tracking-widest block mt-0.5 mb-3">
          Dictionary Lookup
        </span>

        <p className="text-sm text-theme-text-secondary leading-relaxed bg-theme-modal-subcard p-3 rounded-2xl border border-theme-modal-subcard-border">
          {definition}
        </p>

        <button
          onClick={() => {
            soundFx.playKey();
            onClose();
          }}
          className="mt-4 w-full py-2.5 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-text font-black text-xs shadow-md btn-press"
        >
          Close
        </button>
      </div>
    </div>
  );
};
