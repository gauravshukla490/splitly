import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-ink text-paper hover:bg-moss-dark border border-ink",
  secondary:
    "bg-transparent text-ink border border-ink/30 hover:border-ink",
  ghost:
    "bg-transparent text-ink-soft hover:text-ink underline decoration-dotted underline-offset-4",
  danger:
    "bg-transparent text-rust border border-rust/40 hover:bg-rust/5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";