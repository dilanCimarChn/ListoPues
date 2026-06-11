"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/Button"

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-sm font-black text-slate-950">
            LP
          </span>
          Listo Pues
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#funciones" className="text-sm text-text-muted transition-colors hover:text-text-primary">
            Funciones
          </a>
          <a href="#precios" className="text-sm text-text-muted transition-colors hover:text-text-primary">
            Precios
          </a>
          <Link href="/login" className="text-sm text-text-muted transition-colors hover:text-text-primary">
            Iniciar sesion
          </Link>
          <Link href="/registro">
            <Button size="sm">Crear mi tienda</Button>
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-text-muted md:hidden cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu"
        >
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-border/60 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#funciones" onClick={() => setOpen(false)} className="text-sm text-text-muted">
              Funciones
            </a>
            <a href="#precios" onClick={() => setOpen(false)} className="text-sm text-text-muted">
              Precios
            </a>
            <Link href="/login" className="text-sm text-text-muted">
              Iniciar sesion
            </Link>
            <Link href="/registro">
              <Button size="sm" className="w-full">
                Crear mi tienda
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
