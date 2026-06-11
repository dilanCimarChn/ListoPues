import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

const PLANS = [
  {
    name: "Lite",
    price: "Bs 49",
    period: "/mes",
    description: "Tu vitrina online con pedidos por WhatsApp.",
    highlighted: false,
    cta: "Empezar con Lite",
    features: [
      "Vitrina online con tu marca",
      "Hasta 25 productos",
      "Carrito y pedidos por WhatsApp",
      "Bot para administrar tu catalogo por WhatsApp",
      "Pagos online con Wallbit",
      "Soporte por WhatsApp",
    ],
  },
  {
    name: "Pro",
    price: "Bs 149",
    period: "/mes",
    description: "LAIA vende y agenda por ti, 24/7.",
    highlighted: true,
    cta: "Quiero LAIA",
    features: [
      "Todo lo del plan Lite",
      "Hasta 500 productos",
      "LAIA: asistente IA que atiende a tus clientes",
      "Agenda de citas automatica",
      "Registro de ventas y clientes",
      "Historial de conversaciones",
      "Metricas de tu negocio",
      "Dominio propio",
    ],
  },
]

export function Pricing() {
  return (
    <section id="precios" className="mx-auto max-w-5xl px-4 py-20">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Precios simples y claros</h2>
        <p className="mx-auto mt-4 max-w-xl text-text-muted">
          Empieza con Lite y pasa a Pro cuando quieras que LAIA trabaje por ti.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative",
              plan.highlighted && "border-primary/50 shadow-xl shadow-primary/10"
            )}
          >
            {plan.highlighted && (
              <Badge variant="pro" className="absolute -top-3 left-1/2 -translate-x-1/2">
                Recomendado
              </Badge>
            )}
            <CardContent className="space-y-6 p-8">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-text-muted">{plan.description}</p>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="pb-1 text-text-muted">{plan.period}</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <svg
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-text-primary/90">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/registro" className="block">
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "primary" : "secondary"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
