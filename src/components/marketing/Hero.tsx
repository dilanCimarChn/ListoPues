import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.12),transparent_60%)]"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
        <Badge variant="default" className="mb-6">
          Hecho en Bolivia para negocios bolivianos
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl animate-fade-up">
          Vende y agenda por{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            WhatsApp
          </span>
          , listo pues
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
          Crea tu tienda online en minutos. Tus clientes piden por WhatsApp y tu
          administras todo desde un solo lugar. Con el plan Pro, LAIA — tu
          asistente con inteligencia artificial — vende y agenda citas por ti, las 24 horas.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/registro">
            <Button size="lg">Crear mi tienda gratis</Button>
          </Link>
          <a href="#funciones">
            <Button size="lg" variant="secondary">
              Ver como funciona
            </Button>
          </a>
        </div>
        <p className="mt-4 text-sm text-text-muted">
          Sin tarjeta de credito. Tu vitrina lista en menos de 5 minutos.
        </p>
      </div>
    </section>
  )
}
