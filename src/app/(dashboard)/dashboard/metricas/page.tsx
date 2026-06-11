import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { formatPrice } from "@/lib/utils"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default async function MetricasPage() {
  const business = await requireBusiness(true)

  const since = new Date()
  since.setMonth(since.getMonth() - 5)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const [sales, appointmentCount, conversationCount, escalated] = await Promise.all([
    prisma.sale.findMany({
      where: {
        businessId: business.id,
        status: { in: ["PAID", "DELIVERED"] },
        createdAt: { gte: since },
      },
      select: { total: true, createdAt: true },
    }),
    prisma.appointment.count({ where: { businessId: business.id } }),
    prisma.conversation.count({ where: { businessId: business.id } }),
    prisma.conversation.count({
      where: { businessId: business.id, status: "ESCALATED" },
    }),
  ])

  // Ingresos por mes (ultimos 6 meses)
  const months: { label: string; total: number }[] = []
  const cursor = new Date(since)
  for (let i = 0; i < 6; i++) {
    months.push({ label: MONTH_LABELS[cursor.getMonth()], total: 0 })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  for (const sale of sales) {
    const diff =
      (sale.createdAt.getFullYear() - since.getFullYear()) * 12 +
      (sale.createdAt.getMonth() - since.getMonth())
    if (diff >= 0 && diff < 6) months[diff].total += sale.total
  }

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const maxMonth = Math.max(1, ...months.map((m) => m.total))
  const resolutionRate =
    conversationCount > 0
      ? Math.round(((conversationCount - escalated) / conversationCount) * 100)
      : 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metricas</h1>
        <p className="text-sm text-text-muted">El pulso de tu negocio en los ultimos 6 meses</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ingresos (6 meses)"
          value={formatPrice(totalRevenue, business.currency)}
          delay={0}
        />
        <StatsCard title="Ventas confirmadas" value={sales.length} delay={75} />
        <StatsCard title="Citas agendadas" value={appointmentCount} delay={150} />
        <StatsCard
          title="Resolucion de LAIA"
          value={`${resolutionRate}%`}
          hint={`${conversationCount} conversaciones, ${escalated} escaladas`}
          accent={resolutionRate < 70 ? "accent" : "primary"}
          delay={225}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-56 items-end gap-3">
            {months.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-text-muted">
                  {m.total > 0 ? formatPrice(m.total, business.currency) : ""}
                </span>
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-primary-dark to-primary transition-all"
                  style={{ height: `${Math.max(4, (m.total / maxMonth) * 100)}%` }}
                />
                <span className="text-xs text-text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
