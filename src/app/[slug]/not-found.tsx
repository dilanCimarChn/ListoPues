import Link from "next/link"
import { Button } from "@/components/ui/Button"

export default function StoreNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-surface text-3xl">
        ?
      </span>
      <div>
        <h1 className="text-2xl font-bold">Tienda no encontrada</h1>
        <p className="mt-2 max-w-md text-text-muted">
          Esta vitrina no existe o fue desactivada. Si es tu negocio, revisa tu
          enlace en el dashboard.
        </p>
      </div>
      <Link href="/">
        <Button>Ir a Listo Pues</Button>
      </Link>
    </div>
  )
}
