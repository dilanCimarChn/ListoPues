import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { formatPrice } from "@/lib/utils"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { SalesTable } from "@/components/dashboard/SalesTable"
import type { Sale, SaleItem } from "@/types"

export default async function VentasPage() {
  const business = await requireBusiness(true)

  const sales = await prisma.sale.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  })

  const serialized: Sale[] = sales.map((s) => ({
    id: s.id,
    clientName: s.clientName,
    clientPhone: s.clientPhone,
    total: s.total,
    status: s.status,
    receiptUrl: s.receiptUrl,
    items: (s.items as unknown as SaleItem[]) ?? [],
    businessId: s.businessId,
    createdAt: s.createdAt.toISOString(),
  }))

  const confirmed = serialized.filter((s) => s.status === "PAID" || s.status === "DELIVERED")
  const totalRevenue = confirmed.reduce((sum, s) => sum + s.total, 0)
  const pending = serialized.filter((s) => s.status === "PENDING").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ventas</h1>
        <p className="text-sm text-text-muted">
          Ventas generadas por LAIA y por el checkout de tu vitrina
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Ingresos confirmados"
          value={formatPrice(totalRevenue, business.currency)}
          delay={0}
        />
        <StatsCard title="Ventas totales" value={serialized.length} delay={75} />
        <StatsCard
          title="Pendientes de pago"
          value={pending}
          accent={pending > 0 ? "accent" : "primary"}
          delay={150}
        />
      </div>

      <SalesTable sales={serialized} currency={business.currency} />
    </div>
  )
}
