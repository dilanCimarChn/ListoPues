"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import type { Plan } from "@/types"

interface HeaderProps {
  businessName: string
  slug: string
  plan: Plan
}

export function Header({ businessName, slug, plan }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-lg md:px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold md:text-lg">{businessName}</h1>
        <Badge variant={plan === "PRO" ? "pro" : "muted"}>
          {plan === "PRO" ? "Pro" : "Lite"}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/${slug}`} target="_blank">
          <Button variant="secondary" size="sm">
            Ver mi vitrina
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
          Salir
        </Button>
      </div>
    </header>
  )
}
