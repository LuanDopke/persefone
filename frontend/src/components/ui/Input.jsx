import { forwardRef } from 'react';

const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full border-4 border-charcoal bg-offwhite px-4 py-3 font-semibold text-charcoal shadow-hard outline-none placeholder:text-charcoal/50 focus-visible:ring-4 focus-visible:ring-lime/70 aria-[invalid=true]:border-critical disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-gray-200 disabled:text-gray-600 disabled:shadow-none ${className}`}
      {...props}
    />
  );
});

export default Input;
