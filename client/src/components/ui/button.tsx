import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-moss text-white border border-moss shadow-sm hover:bg-moss-dark hover:shadow-lg hover:shadow-moss/20 hover:-translate-y-0.5",
  secondary:
    "bg-white text-ink border-2 border-dashed border-moss/40 hover:border-moss hover:bg-sage-light hover:-translate-y-0.5",
  outline:
    "bg-transparent text-moss border-2 border-dashed border-moss hover:bg-moss hover:text-white hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-ink-soft hover:text-moss underline decoration-dotted underline-offset-4",
  danger:
    "bg-transparent text-rust border border-rust/40 hover:bg-rust/5",
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`rounded-full font-medium tracking-wide transition-all duration-300 ease-out disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
