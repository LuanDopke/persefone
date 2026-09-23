import { cloneElement, isValidElement } from 'react';

export default function FormField({ id, label, required = false, hint, error, children, className = '' }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children) ? cloneElement(children, { id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy }) : children;
  return (
    <div className={className}>
      <label className="mb-2 block font-bold" htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      {control}
      {hint && <p id={`${id}-hint`} className="mt-2 text-sm text-charcoal/70">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-2 font-bold text-critical" role="alert">{error}</p>}
    </div>
  );
}
