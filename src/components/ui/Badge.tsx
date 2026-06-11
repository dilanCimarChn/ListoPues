import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Variant = "default" | "success" | "warning" | "error" | "pro" | "muted"

const variants: Record<Variant, string> = {
  default: "bg-primary/15 text-primary border-primary/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-accent/15 text-accent border-accent/30",
  error: "bg-error/15 text-error border-error/30",
  pro: "bg-gradient-to-r from-accent/20 to-amber-600/20 text-accent border-accent/40",
  muted: "bg-surface-light/50 text-text-muted border-border",
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
