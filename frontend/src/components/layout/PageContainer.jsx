const WIDTHS = {
  standard: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

export default function PageContainer({ children, width = 'wide', className = '', ...props }) {
  return <div className={`mx-auto w-full min-w-0 overflow-x-clip p-4 md:p-6 ${WIDTHS[width] || WIDTHS.wide} ${className}`} {...props}>{children}</div>;
}
