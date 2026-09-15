/**
 * Button — Neobrutalist button component.
 * Constitution Principle I: 4px border, hard shadow, 0px radius, Lexend font.
 * Constitution Principle III: Modular, reusable, single-responsibility.
 */

const VARIANTS = {
  default: 'bg-offwhite text-charcoal hover:bg-gray-100',
  secondary: 'bg-offwhite text-charcoal hover:bg-gray-100',
  primary: 'bg-lime text-charcoal hover:bg-lime-300',
  lime: 'bg-lime text-charcoal hover:bg-lime-300',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'bg-transparent text-charcoal hover:bg-gray-100 border-transparent shadow-none',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export function Button({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const variantClasses = VARIANTS[variant] || VARIANTS.default;
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center',
        'font-bold uppercase tracking-wide',
        'border-4 border-charcoal shadow-hard',
        'transition-[transform,box-shadow,background-color] duration-75 motion-reduce:transition-none',
        'outline-none focus-visible:ring-4 focus-visible:ring-lime/70',
        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed',
        'disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-600 disabled:opacity-70 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-hard',
        variantClasses,
        sizeClasses,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
