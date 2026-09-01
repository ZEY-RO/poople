import React, { useEffect } from 'react';
import { KeyboardLayout } from '../types/game';
import { Delete, CornerDownLeft } from 'lucide-react';
import { soundFx } from '../services/audio';

interface VirtualKeyboardProps {
  layout?: KeyboardLayout;
  onKeyPress: (letter: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  hapticsEnabled?: boolean;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  layout = 'qwerty',
  onKeyPress,
  onDelete,
  onSubmit,
  disabled = false,
  hapticsEnabled = true
}) => {
  // Global physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        soundFx.playKey();
        onSubmit();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        soundFx.playDelete();
        onDelete();
      } else {
        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          e.preventDefault();
          soundFx.playKey();
          onKeyPress(key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onKeyPress, onDelete, onSubmit]);

  const triggerHaptic = () => {
    if (hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch (e) {
        // ignore vibrate failures
      }
    }
  };

  const getLayoutRows = (): string[][] => {
    switch (layout) {
      case 'azerty':
        return [
          ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
          ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
          ['W', 'X', 'C', 'V', 'B', 'N']
        ];
      case 'dvorak':
        return [
          ['P', 'Y', 'F', 'G', 'C', 'R', 'L'],
          ['A', 'O', 'E', 'U', 'I', 'D', 'H', 'T', 'N', 'S'],
          ['Q', 'J', 'K', 'X', 'B', 'M', 'W', 'V', 'Z']
        ];
      case 'abc':
        return [
          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
          ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
          ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
        ];
      case 'qwerty':
      default:
        return [
          ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
          ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
          ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
        ];
    }
  };

  const rows = getLayoutRows();

  return (
    <div className="w-full max-w-lg mx-auto px-2 py-2 select-none">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {/* Row 1 */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          {rows[0].map(key => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => {
                triggerHaptic();
                soundFx.playKey();
                onKeyPress(key);
              }}
              className="flex-1 max-w-10 h-11 sm:h-12 flex items-center justify-center font-display font-black text-sm sm:text-base rounded-xl bg-theme-key text-theme-key-text shadow-sm border border-theme-key-border hover:bg-theme-key-hover active:scale-95 transition-all btn-press disabled:opacity-50"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex justify-center gap-1 sm:gap-1.5 px-2 sm:px-4">
          {rows[1].map(key => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => {
                triggerHaptic();
                soundFx.playKey();
                onKeyPress(key);
              }}
              className="flex-1 max-w-10 h-11 sm:h-12 flex items-center justify-center font-display font-black text-sm sm:text-base rounded-xl bg-theme-key text-theme-key-text shadow-sm border border-theme-key-border hover:bg-theme-key-hover active:scale-95 transition-all btn-press disabled:opacity-50"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Row 3 (with Enter and Backspace) */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          {/* Enter / Submit Button */}
          <button
            disabled={disabled}
            onClick={() => {
              triggerHaptic();
              onSubmit();
            }}
            className="px-2.5 sm:px-4 h-11 sm:h-12 flex items-center justify-center gap-1 font-display font-black text-xs sm:text-sm rounded-xl bg-theme-key-special-bg hover:opacity-90 text-theme-key-special-text border border-theme-key-special-border shadow-md active:scale-95 transition-all btn-press disabled:opacity-50"
            title="Submit Word (Enter)"
            aria-label="Submit word"
          >
            <span className="hidden sm:inline">ENTER</span>
            <CornerDownLeft className="w-4 h-4" />
          </button>

          {rows[2].map(key => (
            <button
              key={key}
              disabled={disabled}
              onClick={() => {
                triggerHaptic();
                soundFx.playKey();
                onKeyPress(key);
              }}
              className="flex-1 max-w-10 h-11 sm:h-12 flex items-center justify-center font-display font-black text-sm sm:text-base rounded-xl bg-theme-key text-theme-key-text shadow-sm border border-theme-key-border hover:bg-theme-key-hover active:scale-95 transition-all btn-press disabled:opacity-50"
            >
              {key}
            </button>
          ))}

          {/* Delete / Backspace Button */}
          <button
            disabled={disabled}
            onClick={() => {
              triggerHaptic();
              soundFx.playDelete();
              onDelete();
            }}
            className="px-2.5 sm:px-4 h-11 sm:h-12 flex items-center justify-center rounded-xl bg-theme-key-backspace-bg text-theme-key-backspace-text shadow-sm border border-theme-key-backspace-border hover:opacity-90 active:scale-95 transition-all btn-press disabled:opacity-50"
            title="Backspace (Delete)"
            aria-label="Delete letter"
          >
            <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
