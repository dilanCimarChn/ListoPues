import Link from "next/link"
import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { formatPrice, PLAN_LIMITS, remainingSlots } from "@/lib/utils"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"

export default async function DashboardPage() {
  const business = await requireBusiness()

  const [productCount, outOfStock, salesMonth, appointmentsPending] =
    await Promise.all([
      prisma.product.count({ where: { businessId: business.id } }),
      prisma.product.count({
        where: { businessId: business.id, OR: [{ stock: 0 }, { available: false }] },
      }),
      prisma.sale.aggregate({
        where: {
          businessId: business.id,
          status: { in: ["PAID", "DELIVERED"] },
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.appointment.count({
        where: { businessId: business.id, status: "PENDING" },
      }),
    ])

  const remaining = remainingSlots(business.plan, productCount)
  const isPro = business.plan === "PRO"

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resumen</h1>
          <p className="text-sm text-text-muted">
            Asi va tu negocio hoy. Tu vitrina: /{business.slug}
          </p>
        </div>
        <Link href="/dashboard/productos/nuevo">
          <Button>Nuevo producto</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Productos" value={productCount} hint={`Limite del plan: ${PLAN_LIMITS[business.plan].products}`} delay={0} />
        <StatsCard
          title="Cupos disponibles"
          value={remaining}
          accent={remaining === 0 ? "error" : "primary"}
          hint={remaining === 0 ? "Llegaste al limite de tu plan" : "Productos que aun puedes crear"}
          delay={75}
        />
        <StatsCard
          title="Agotados"
          value={outOfStock}
          accent={outOfStock > 0 ? "accent" : "primary"}
          hint="Productos sin stock"
          delay={150}
        />
        {isPro ? (
          <StatsCard
            title="Ventas del mes"
            value={formatPrice(salesMonth._sum.total ?? 0, business.currency)}
            hint={`${salesMonth._count} ventas confirmadas`}
            delay={225}
          />
        ) : (
          <StatsCard title="Citas y ventas" value="Pro" accent="accent" hint="Disponible en el plan Pro" delay={225} />
        )}
      </div>

      {isPro && appointmentsPending > 0 && (
        <Card className="border-accent/40">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm">
              Tienes <span className="font-semibold text-accent">{appointmentsPending}</span>{" "}
              cita{appointmentsPending === 1 ? "" : "s"} pendiente{appointmentsPending === 1 ? "" : "s"} de confirmar.
            </p>
            <Link href="/dashboard/citas">
              <Button variant="secondary" size="sm">
                Ver citas
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Primeros pasos</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-text-muted">
            <li>1. Crea tus categorias y productos en el menu de la izquierda.</li>
            <li>2. Sube tu logo y elige tu color en Configuracion.</li>
            <li>
              3. Comparte tu vitrina:{" "}
              <span className="text-primary">listopues.com/{business.slug}</span>
            </li>
            {isPro ? (
              <li>4. Personaliza a LAIA para que atienda a tus clientes 24/7.</li>
            ) : (
              <li>
                4. ¿Quieres que LAIA venda por ti?{" "}
                <Link href="/dashboard/mi-plan" className="text-accent hover:underline">
                  Conoce el plan Pro
                </Link>
              </li>
            )}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
