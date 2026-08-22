import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  isLoading?: boolean;
};

const variantClasses = {
  primary: "bg-action text-action-foreground hover:bg-action-hover",
  secondary: "border border-border-strong bg-surface text-text hover:bg-canvas",
  ghost: "bg-transparent text-text-muted hover:bg-canvas hover:text-text",
  danger: "bg-danger text-action-foreground hover:opacity-90",
} as const;

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const sizeClass = size === "sm" ? "min-h-9 px-3 text-sm" : "min-h-11 px-4 text-sm";

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${sizeClass} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
