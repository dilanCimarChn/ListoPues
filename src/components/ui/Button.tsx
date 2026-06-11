import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent"
type Size = "sm" | "md" | "lg"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-primary to-primary-dark text-slate-950 font-semibold hover:opacity-90 shadow-lg shadow-primary/20",
  secondary:
    "bg-surface-light text-text-primary hover:bg-surface-light/80 border border-border",
  ghost: "bg-transparent text-text-muted hover:text-text-primary hover:bg-surface",
  danger: "bg-error/10 text-error border border-error/30 hover:bg-error/20",
  accent:
    "bg-gradient-to-r from-accent to-amber-600 text-slate-950 font-semibold hover:opacity-90 shadow-lg shadow-accent/20",
}

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading, className, children, disabled, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        )}
        {children}
      </button>
    )
  }
)
