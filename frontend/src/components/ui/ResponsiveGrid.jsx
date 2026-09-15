const VARIANTS = {
  cards: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  analytics: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-12',
};

export default function ResponsiveGrid({ children, variant = 'cards', as: Component = 'div', className = '', ...props }) {
  return <Component className={`grid min-w-0 gap-5 ${VARIANTS[variant] || VARIANTS.cards} ${className}`} {...props}>{children}</Component>;
}
