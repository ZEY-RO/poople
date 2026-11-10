import React, { useEffect, useRef } from 'react';
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

const LAYOUTS: Record<KeyboardLayout, string[]> = {
  qwerty: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'],
  azerty: ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'],
  dvorak: ['PYFGCRL', 'AOEUIDHTNS', 'QJKXBMWVZ'],
  abc: ['ABCDEFGHI', 'JKLMNOPQR', 'STUVWXYZ']
};

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  layout = 'qwerty', onKeyPress, onDelete, onSubmit, disabled = false, hapticsEnabled = true
}) => {
  const nativeControlFocus = useRef(false);
  useEffect(() => {
    const handlePointerDown = () => { nativeControlFocus.current = false; };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') { nativeControlFocus.current = true; return; }
      if (disabled || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      // Keep native activation for controls reached with Tab; pointer-focused controls
      // should not consume Enter when the player resumes typing a word.
      if (event.key === 'Enter' && nativeControlFocus.current && target instanceof Element && target.closest('button, a, [role="button"]')) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]')) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        if (!event.repeat) {
          soundFx.playKey();
          onSubmit();
        }
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        soundFx.playDelete();
        onDelete();
      } else if (/^[a-z]$/i.test(event.key)) {
        event.preventDefault();
        soundFx.playKey();
        onKeyPress(event.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [disabled, onKeyPress, onDelete, onSubmit]);

  const activate = (action: () => void, isDelete = false) => {
    if (disabled) return;
    if (hapticsEnabled && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(10); } catch { /* Haptics are optional. */ }
    }
    if (isDelete) soundFx.playDelete(); else soundFx.playKey();
    action();
  };
  const keyClass = 'min-w-0 flex-1 max-w-11 h-12 flex items-center justify-center font-semibold text-sm rounded-lg bg-theme-key text-theme-key-text border border-theme-key-border shadow-sm hover:bg-theme-key-hover transition-colors btn-press disabled:opacity-40 disabled:cursor-not-allowed';
  const rows = LAYOUTS[layout] || LAYOUTS.qwerty;

  return (
    <div className="w-full max-w-lg mx-auto px-2 py-3 select-none" role="group" aria-label={`${layout.toUpperCase()} game keyboard`}>
      <div className="flex flex-col gap-1.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={`flex justify-center gap-1 sm:gap-1.5 ${rowIndex === 1 ? 'px-3 sm:px-5' : ''}`}>
            {rowIndex === 2 && (
              <button type="button" disabled={disabled} onMouseDown={event => event.preventDefault()}
                onClick={() => activate(onSubmit)}
                className="min-w-12 sm:min-w-16 h-12 px-2 flex items-center justify-center gap-1 rounded-lg bg-theme-key-special-bg text-theme-key-special-text border border-theme-key-special-border font-semibold text-[10px] btn-press disabled:opacity-40"
                title="Submit word (Enter)" aria-label="Submit word">
                <CornerDownLeft className="w-4 h-4" /><span className="hidden sm:inline">Enter</span>
              </button>
            )}
            {row.split('').map(key => (
              <button type="button" key={key} disabled={disabled} onMouseDown={event => event.preventDefault()}
                onClick={() => activate(() => onKeyPress(key))} className={keyClass} aria-label={`Letter ${key}`}>
                {key}
              </button>
            ))}
            {rowIndex === 2 && (
              <button type="button" disabled={disabled} onMouseDown={event => event.preventDefault()}
                onClick={() => activate(onDelete, true)}
                className="min-w-12 sm:min-w-14 h-12 px-2 flex items-center justify-center rounded-lg bg-theme-key-backspace-bg text-theme-key-backspace-text border border-theme-key-backspace-border btn-press disabled:opacity-40"
                title="Delete letter (Backspace)" aria-label="Delete letter">
                <Delete className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
