import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { InventoryEditor } from "@/components/dashboard/InventoryEditor"
import { PLAN_LIMITS, remainingSlots } from "@/lib/utils"

export default async function InventarioPage() {
  const business = await requireBusiness()

  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    select: { id: true, name: true, price: true, stock: true, available: true },
    orderBy: { stock: "asc" },
  })

  const outOfStock = products.filter((p) => p.stock === 0 || !p.available).length
  const lowStock = products.filter((p) => p.available && p.stock > 0 && p.stock <= 5).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventario</h1>
        <p className="text-sm text-text-muted">
          Edita el stock directamente; al guardar, los productos sin stock se marcan como agotados
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total productos" value={products.length} delay={0} />
        <StatsCard
          title="Cupos libres"
          value={remainingSlots(business.plan, products.length)}
          hint={`Limite: ${PLAN_LIMITS[business.plan].products}`}
          delay={75}
        />
        <StatsCard title="Stock bajo" value={lowStock} accent="accent" hint="5 unidades o menos" delay={150} />
        <StatsCard title="Agotados" value={outOfStock} accent={outOfStock > 0 ? "error" : "primary"} delay={225} />
      </div>

      <InventoryEditor products={products} currency={business.currency} />
    </div>
  )
}
