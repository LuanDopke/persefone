/**
 * Modal — Neobrutalist overlay dialog component.
 * Constitution Principle I: 4px border, hard shadow, sharp corners.
 * Constitution Principle III: Modular, reusable modal with title and close action.
 */

import { useEffect } from 'react';
import { Button } from './Button';

export function Modal({ open, onClose, title, children, className = '' }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/60"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className={[
          'relative z-10 w-full max-w-lg mx-4',
          'border-4 border-charcoal bg-offwhite shadow-hard-lg',
          className,
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-charcoal px-5 py-3 bg-lime">
          <h2 className="text-lg font-bold uppercase tracking-wide text-charcoal">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="border-2 border-charcoal bg-offwhite shadow-hard-sm"
          >
            ✕
          </Button>
        </div>

        {/* Body */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
