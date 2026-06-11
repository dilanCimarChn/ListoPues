import { Navbar } from "@/components/marketing/Navbar"
import { Hero } from "@/components/marketing/Hero"
import { Features } from "@/components/marketing/Features"
import { Pricing } from "@/components/marketing/Pricing"
import { Footer } from "@/components/marketing/Footer"
import Link from "next/link"
import { Button } from "@/components/ui/Button"

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Pricing />

        <section className="mx-auto max-w-4xl px-4 pb-24 text-center">
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-10 md:p-14">
            <h2 className="text-3xl font-bold md:text-4xl">
              Tu negocio abierto las 24 horas
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-muted">
              Mientras duermes, LAIA responde, vende y agenda. Crea tu cuenta hoy
              y comparte tu vitrina en minutos.
            </p>
            <Link href="/registro" className="mt-8 inline-block">
              <Button size="lg">Crear mi tienda ahora</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
