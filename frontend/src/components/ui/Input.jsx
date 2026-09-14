import { forwardRef } from 'react';

const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full border-4 border-charcoal bg-offwhite px-4 py-3 font-semibold text-charcoal shadow-hard outline-none placeholder:text-charcoal/50 focus:ring-4 focus:ring-lime/70 ${className}`}
      {...props}
    />
  );
});

export default Input;
