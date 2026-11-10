import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  label: string;
  onClose?: () => void;
  children: React.ReactNode;
}

/** Shared dialog behavior keeps keyboard input and focus out of the game underneath. */
export const Modal: React.FC<ModalProps> = ({ label, onClose, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => {
      const initialFocus = dialogRef.current?.querySelector<HTMLElement>('input:not([type="checkbox"]):not([type="range"])')
        || dialogRef.current?.querySelector<HTMLElement>('button:not([disabled]), [tabindex="0"]');
      (initialFocus || dialogRef.current)?.focus();
      if (initialFocus instanceof HTMLInputElement) initialFocus.select();
    });
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget) closeRef.current?.();
      }}
      onKeyDown={event => {
        // Native window listeners power the game; dialogs must own their keystrokes.
        event.stopPropagation();
        if (event.key === 'Escape' && closeRef.current) {
          event.preventDefault();
          closeRef.current();
        }
        if (event.key === 'Tab') {
          const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]'
          ) || []).filter(element => element.getClientRects().length > 0);
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (!first) {
            event.preventDefault();
            dialogRef.current?.focus();
          } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="w-full max-w-md outline-none">
        {children}
      </div>
    </div>,
    document.body
  );
};
