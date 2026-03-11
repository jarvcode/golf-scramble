import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-cream/70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full bg-forest-800 border-2 rounded-xl px-4 py-3.5 text-base text-cream',
            'placeholder-cream/40 transition-colors duration-150',
            'focus:outline-none',
            error
              ? 'border-red-400 focus:border-red-400'
              : 'border-forest-700 focus:border-gold-500',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-cream/40">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
