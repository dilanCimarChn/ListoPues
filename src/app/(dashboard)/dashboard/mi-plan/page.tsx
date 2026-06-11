import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { PLAN_LIMITS } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

const PRO_FEATURES = [
  "LAIA: asistente IA que atiende a tus clientes por WhatsApp 24/7",
  "Agenda de citas automatica con calendario",
  "Registro de ventas con pagos Wallbit",
  "Historial completo de conversaciones",
  "Base de clientes",
  "Metricas de tu negocio",
  "Hasta 500 productos",
  "Dominio propio para tu vitrina",
]

export default async function MiPlanPage() {
  const business = await requireBusiness()
  const productCount = await prisma.product.count({
    where: { businessId: business.id },
  })
  const limit = PLAN_LIMITS[business.plan].products
  const isPro = business.plan === "PRO"
  const usagePercent = Math.min(100, Math.round((productCount / limit) * 100))

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi plan</h1>
        <p className="text-sm text-text-muted">Tu suscripcion y el uso de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plan actual</CardTitle>
            <Badge variant={isPro ? "pro" : "muted"}>{isPro ? "Pro" : "Lite"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-text-muted">Productos usados</span>
              <span>
                {productCount} / {limit}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-light">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-text-muted">
            {isPro
              ? "Tienes acceso a todas las funciones de Listo Pues, incluida LAIA."
              : "Tu plan Lite incluye la vitrina, pedidos por WhatsApp y el bot de administracion."}
          </p>
        </CardContent>
      </Card>

      {!isPro && (
        <Card className="border-accent/40 bg-gradient-to-br from-accent/10 to-transparent">
          <CardHeader>
            <CardTitle>Pasa a Pro y deja que LAIA trabaje por ti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="space-y-2.5">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <svg
                    className="mt-0.5 size-4 shrink-0 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-extrabold">Bs 149</span>
              <span className="pb-1 text-sm text-text-muted">/mes</span>
            </div>
            <a
              href={`https://wa.me/59170000000?text=${encodeURIComponent(
                `Hola! Quiero mejorar mi negocio "${business.name}" al plan Pro de Listo Pues.`
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="accent" size="lg">
                Quiero el plan Pro
              </Button>
            </a>
            <p className="text-xs text-text-muted">
              Te contactamos por WhatsApp para activar tu plan en menos de 24 horas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
