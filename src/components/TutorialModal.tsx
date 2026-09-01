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
          <div className="px-3 py-2 rounded-xl bg-theme-tile-start-bg text-theme-tile-start-text border-2 border-theme-tile-start-border font-display font-black text-xl shadow-sm">
            FART
          </div>
          <ArrowRight className="w-5 h-5 text-theme-accent animate-pulse" />
          <div className="px-3 py-2 rounded-xl bg-theme-bg-secondary text-theme-text-muted font-display font-black text-xl border border-theme-border/60">
            ????
          </div>
          <ArrowRight className="w-5 h-5 text-theme-accent animate-pulse" />
          <div className="px-3 py-2 rounded-xl bg-theme-tile-correct-bg text-theme-tile-correct-text font-display font-black text-xl shadow-md glow-theme">
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
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-theme-tile-empty text-theme-tile-empty-text border border-theme-tile-border">F</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-theme-tile-empty text-theme-tile-empty-text border border-theme-tile-border">A</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-theme-tile-empty text-theme-tile-empty-text border border-theme-tile-border">R</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-theme-tile-empty text-theme-tile-empty-text border border-theme-tile-border">T</span>
          </div>
          <div className="text-center text-xs text-theme-accent font-bold">⬇ Change 'A' to 'O'</div>
          <div className="flex justify-center gap-1.5 font-display font-black text-lg">
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-theme-tile-empty text-theme-tile-empty-text border border-theme-tile-border">F</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-theme-tile-diff-bg text-theme-tile-diff-text border border-theme-tile-diff-border shadow-sm scale-110">O</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-theme-tile-empty text-theme-tile-empty-text border border-theme-tile-border">R</span>
            <span className="w-9 h-10 flex items-center justify-center rounded-lg bg-theme-tile-empty text-theme-tile-empty-text border border-theme-tile-border">T</span>
          </div>
        </div>
      )
    },
    {
      title: "Strategy: Work Backwards! 💡",
      description: "Think about words that are just 1 move away from POOP, such as COOP, LOOP, POOL, POOR, or PLOP. Steer your ladder toward them!",
      diagram: (
        <div className="p-3 rounded-2xl bg-theme-modal-subcard border border-theme-modal-subcard-border">
          <span className="text-[11px] font-bold text-theme-text-muted block mb-1">
            Finishing Gates into POOP:
          </span>
          <div className="flex flex-wrap gap-1.5 justify-center font-mono font-bold text-xs">
            {['COOP', 'LOOP', 'POOL', 'POOR', 'PLOP', 'HOOP', 'POMP', 'BOOP'].map(w => (
              <span key={w} className="px-2 py-1 rounded-lg bg-theme-bg-secondary text-theme-accent border border-theme-border/60">
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
          <div className="p-2 rounded-xl bg-theme-modal-subcard border border-theme-modal-subcard-border text-center">
            <span className="font-bold block text-theme-text-primary">👑 Golden Flush</span>
            <span className="text-[10px] text-theme-text-muted">Par steps (Flawless)</span>
          </div>
          <div className="p-2 rounded-xl bg-theme-modal-subcard border border-theme-modal-subcard-border text-center">
            <span className="font-bold block text-theme-text-primary">🥇 Royal Flusher</span>
            <span className="text-[10px] text-theme-text-muted">Par + 1 step</span>
          </div>
        </div>
      )
    }
  ];

  const current = slides[slide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md bg-theme-modal text-theme-text-primary rounded-3xl shadow-2xl border border-theme-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-theme-border/60 flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-theme-text-primary flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-theme-accent" />
            How to Play Poople
          </h2>
          <button
            onClick={() => {
              soundFx.playKey();
              onClose();
            }}
            className="p-1 rounded-xl text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-secondary btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="p-5 flex-1 flex flex-col justify-center text-center space-y-4">
          <h3 className="text-base sm:text-lg font-display font-black text-theme-text-primary">
            {current.title}
          </h3>

          <div className="my-2">
            {current.diagram}
          </div>

          <p className="text-xs sm:text-sm text-theme-text-secondary leading-relaxed">
            {current.description}
          </p>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 pt-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  slide === idx ? 'w-6 bg-theme-accent' : 'w-2 bg-theme-border/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-theme-modal-subcard border-t border-theme-border/60 flex justify-between gap-2">
          {slide > 0 ? (
            <button
              onClick={() => {
                soundFx.playKey();
                setSlide(slide - 1);
              }}
              className="py-2 px-4 rounded-xl bg-theme-bg-card text-theme-text-secondary border border-theme-border/60 font-bold text-xs btn-press"
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
              className="py-2 px-5 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-theme-accent-text font-black text-xs shadow-md btn-press"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                soundFx.playKey();
                onClose();
              }}
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md btn-press"
            >
              Got It, Let's Play! 💩
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
