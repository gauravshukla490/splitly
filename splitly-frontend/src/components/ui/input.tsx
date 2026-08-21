import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs uppercase tracking-widest text-ink-soft"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`bg-transparent border-b border-ink/25 px-1 py-2 text-ink placeholder:text-ink-soft/50 focus:outline-none focus:border-moss transition-colors ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";