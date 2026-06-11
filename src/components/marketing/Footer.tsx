import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-text-muted md:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-[10px] font-black text-slate-950">
            LP
          </span>
          <span>Listo Pues — {new Date().getFullYear()}</span>
        </div>
        <nav className="flex gap-6">
          <a href="#funciones" className="transition-colors hover:text-text-primary">
            Funciones
          </a>
          <a href="#precios" className="transition-colors hover:text-text-primary">
            Precios
          </a>
          <Link href="/login" className="transition-colors hover:text-text-primary">
            Iniciar sesion
          </Link>
        </nav>
        <p>Hecho con carino en Bolivia</p>
      </div>
    </footer>
  )
}
