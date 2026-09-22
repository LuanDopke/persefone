/**
 * Card — Neobrutalist container component.
 * Constitution Principle I: 4px border, hard shadow, 0px radius.
 * Constitution Principle III: Modular, reusable with header/body/footer slots.
 */

const DENSITY = { default: 'p-5', compact: 'p-3' };
const HEADER_TONES = {
  lime: 'bg-lime text-charcoal',
  botanical: 'bg-mint text-charcoal',
  charcoal: 'bg-primary text-offwhite',
  offwhite: 'bg-offwhite text-charcoal',
};

export function Card({ children, title, footer, density = 'default', headerTone = 'lime', className = '', ...props }) {
  return (
    <div
      className={[
        'border-4 border-charcoal bg-surface shadow-hard',
        className,
      ].join(' ')}
      {...props}
    >
      {title && (
        <div className={`border-b-4 border-charcoal px-5 py-3 ${HEADER_TONES[headerTone] || HEADER_TONES.lime}`}>
          <h3 className="text-lg font-bold uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      <div className={DENSITY[density] || DENSITY.default}>
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
