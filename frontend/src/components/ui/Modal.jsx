/**
 * Modal — Neobrutalist overlay dialog component.
 * Constitution Principle I: 4px border, hard shadow, sharp corners.
 * Constitution Principle III: Modular, reusable modal with title and close action.
 */

import { useEffect, useId, useRef } from 'react';
import { Button } from './Button';

export function Modal({ open, onClose, title, children, className = '' }) {
  const panelRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      const panel = panelRef.current;
      const focusable = panel?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusable?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      if (open && openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...(panelRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [])].filter((element) => !element.disabled);
      if (!focusable.length) { event.preventDefault(); panelRef.current?.focus(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        ref={panelRef}
        tabIndex={-1}
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
          <h2 id={titleId} className="text-lg font-bold uppercase tracking-wide text-charcoal">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar"
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
