const WIDTHS = {
  standard: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

export default function PageContainer({ children, width = 'wide', className = '', ...props }) {
  return <div className={`mx-auto w-full min-w-0 overflow-x-clip p-4 pb-10 md:p-8 ${WIDTHS[width] || WIDTHS.wide} ${className}`} {...props}>{children}</div>;
}
