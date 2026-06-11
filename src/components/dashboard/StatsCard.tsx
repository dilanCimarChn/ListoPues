import { Card, CardContent } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  hint?: string
  accent?: "primary" | "accent" | "error"
  delay?: number
}

const accents = {
  primary: "text-primary",
  accent: "text-accent",
  error: "text-error",
}

export function StatsCard({ title, value, hint, accent = "primary", delay = 0 }: StatsCardProps) {
  return (
    <Card className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="space-y-1">
        <p className="text-sm text-text-muted">{title}</p>
        <p className={cn("text-3xl font-bold", accents[accent])}>{value}</p>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </CardContent>
    </Card>
  )
}
