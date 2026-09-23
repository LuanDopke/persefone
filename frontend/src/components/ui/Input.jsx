import { forwardRef } from 'react';

const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full border-4 border-charcoal bg-surface px-4 py-3 font-semibold text-charcoal shadow-hard outline-none transition-[transform,box-shadow,background-color] duration-100 placeholder:text-charcoal/45 focus:-translate-x-0.5 focus:-translate-y-0.5 focus:bg-lime-50 focus:shadow-hard-lg focus-visible:ring-4 focus-visible:ring-primary/40 aria-[invalid=true]:border-critical aria-[invalid=true]:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-gray-200 disabled:text-gray-600 disabled:shadow-none ${className}`}
      {...props}
    />
  );
});

export default Input;
