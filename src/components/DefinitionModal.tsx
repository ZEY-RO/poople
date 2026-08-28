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
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-700 overflow-hidden p-5 text-center relative">
        <button
          onClick={() => {
            soundFx.playKey();
            onClose();
          }}
          className="absolute top-4 right-4 p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 btn-press"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-display font-black text-amber-950 dark:text-amber-300 tracking-wider">
          {word.toUpperCase()}
        </h2>
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block mt-0.5 mb-3">
          Dictionary Lookup
        </span>

        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed bg-amber-50/50 dark:bg-slate-800 p-3 rounded-2xl border border-amber-100 dark:border-slate-700">
          {definition}
        </p>

        <button
          onClick={() => {
            soundFx.playKey();
            onClose();
          }}
          className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 btn-press"
        >
          Close
        </button>
      </div>
    </div>
  );
};
