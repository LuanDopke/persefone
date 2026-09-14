/**
 * Card — Neobrutalist container component.
 * Constitution Principle I: 4px border, hard shadow, 0px radius.
 * Constitution Principle III: Modular, reusable with header/body/footer slots.
 */

export function Card({ children, title, footer, className = '', ...props }) {
  return (
    <div
      className={[
        'border-4 border-charcoal bg-offwhite shadow-hard',
        className,
      ].join(' ')}
      {...props}
    >
      {title && (
        <div className="border-b-4 border-charcoal px-5 py-3 bg-lime">
          <h3 className="text-lg font-bold uppercase tracking-wide text-charcoal">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
      {footer && (
        <div className="border-t-4 border-charcoal px-5 py-3 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}
