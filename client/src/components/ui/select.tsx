import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, id, className = "", children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-widest text-ink-soft">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`bg-cream/60 border-2 border-dashed border-moss/20 rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-moss focus:bg-white transition-all duration-300 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
