import React, { useState } from 'react';
import { HelpCircle, ArrowRight, X } from 'lucide-react';
import { soundFx } from '../services/audio';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [slide, setSlide] = useState<number>(0);

  const slides = [
    {
      title: "The Goal: Reach POOP! 💩",
      description: "Transform the starting 4-letter word into POOP in as few steps as possible.",
      diagram: (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="px-3 py-2 rounded-xl bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 font-display font-black text-xl shadow-sm">
            FART
          </div>
          <ArrowRight className="w-5 h-5 text-amber-500 animate-pulse" />
          <div className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-stone-300 font-display font-black text-xl border border-stone-300">
            ????
          </div>
          <ArrowRight className="w-5 h-5 text-amber-500 animate-pulse" />
          <div className="px-3 py-2 rounded-xl bg-amber-500 text-white font-display font-black text-xl shadow-md animate-glow">
            POOP
          </div>
        </div>
      )
    },
    {
      title: "Rule 1: Exactly One Letter Change",
      description: "Each guess must differ from the previous word by exactly 1 character and must be a valid English word.",
      diagram: (
        <div className="space-y-2 py-2">
          <div className="flex justify-center gap-1.5 font-display font-black text-lg">
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-amber-100 dark:bg-slate-700">F</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-amber-100 dark:bg-slate-700">A</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-amber-100 dark:bg-slate-700">R</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-amber-100 dark:bg-slate-700">T</span>
          </div>
          <div className="text-center text-xs text-amber-600 font-bold">⬇ Change 'A' to 'O'</div>
          <div className="flex justify-center gap-1.5 font-display font-black text-lg">
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-amber-100 dark:bg-slate-700">F</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm scale-110">O</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-amber-100 dark:bg-slate-700">R</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-amber-100 dark:bg-slate-700">T</span>
          </div>
        </div>
      )
    },
    {
      title: "Strategy: Work Backwards! 💡",
      description: "Think about words that are just 1 move away from POOP, such as COOP, LOOP, POOL, POOR, or PLOP. Steer your ladder toward them!",
      diagram: (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200/60 dark:border-slate-700">
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
            Finishing Gates into POOP:
          </span>
          <div className="flex flex-wrap gap-1.5 justify-center font-mono font-bold text-xs">
            {['COOP', 'LOOP', 'POOL', 'POOR', 'PLOP', 'HOOP', 'POMP', 'BOOP'].map(w => (
              <span key={w} className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-300 border border-amber-300">
                {w}
              </span>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Par & Ratings 🏆",
      description: "Every puzzle has an optimal shortest path (Par). Finding the solution in the exact Par steps earns the legendary Golden Flush badge!",
      diagram: (
        <div className="grid grid-cols-2 gap-2 text-xs py-2">
          <div className="p-2 rounded-xl bg-amber-100/70 dark:bg-slate-800 border border-amber-300 text-center">
            <span className="font-bold block text-amber-900 dark:text-amber-300">👑 Golden Flush</span>
            <span className="text-[10px] text-stone-500">Par steps (Flawless)</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-100/70 dark:bg-slate-800 border border-amber-300 text-center">
            <span className="font-bold block text-amber-900 dark:text-amber-300">🥇 Royal Flusher</span>
            <span className="text-[10px] text-stone-500">Par + 1 step</span>
          </div>
        </div>
      )
    }
  ];

  const current = slides[slide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-amber-950 dark:text-amber-300 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            How to Play Poople
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

        {/* Slide Body */}
        <div className="p-5 flex-1 flex flex-col justify-center text-center space-y-4">
          <h3 className="text-base sm:text-lg font-display font-black text-stone-900 dark:text-stone-100">
            {current.title}
          </h3>

          <div className="my-2">
            {current.diagram}
          </div>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {current.description}
          </p>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 pt-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  slide === idx ? 'w-6 bg-amber-500' : 'w-2 bg-stone-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-stone-50 dark:bg-slate-800/80 border-t border-stone-200 dark:border-slate-700 flex justify-between gap-2">
          {slide > 0 ? (
            <button
              onClick={() => {
                soundFx.playKey();
                setSlide(slide - 1);
              }}
              className="py-2 px-4 rounded-xl bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300 font-bold text-xs btn-press"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          {slide < slides.length - 1 ? (
            <button
              onClick={() => {
                soundFx.playKey();
                setSlide(slide + 1);
              }}
              className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 btn-press"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                soundFx.playKey();
                onClose();
              }}
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 btn-press"
            >
              Got It, Let's Play! 💩
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
