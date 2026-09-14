/**
 * Badge — Status indicator for Owned / Missing visual states.
 * Constitution Principle I: Vibrant vs desaturated state differentiation.
 * Constitution Principle III: Modular, reusable badge component.
 */

const STATUS_STYLES = {
  owned: 'bg-lime text-charcoal border-charcoal',
  missing: 'bg-gray-200 text-gray-600 border-gray-400',
};

const LABELS = {
  owned: 'Owned',
  missing: 'Missing',
};

export function Badge({ status = 'missing', label, className = '' }) {
  const statusClasses = STATUS_STYLES[status] || STATUS_STYLES.missing;
  const displayLabel = label || LABELS[status] || status;

  return (
    <span
      className={[
        'inline-flex items-center',
        'px-3 py-1 text-xs font-bold uppercase tracking-wider',
        'border-2',
        statusClasses,
        className,
      ].join(' ')}
    >
      {displayLabel}
    </span>
  );
}
