"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ProductCard } from "@/components/storefront/ProductCard"
import { CartDrawer } from "@/components/storefront/CartDrawer"
import type { Business, Category, Product } from "@/types"

interface StorefrontProps {
  business: Business
  products: Product[]
  categories: Category[]
}

export function Storefront({ business, products, categories }: StorefrontProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = activeCategory
    ? products.filter((p) => p.categoryId === activeCategory)
    : products

  const featured = filtered.filter((p) => p.featured)
  const rest = filtered.filter((p) => !p.featured)
  const ordered = [...featured, ...rest]

  return (
    <div className="min-h-screen pb-24">
      {/* Encabezado del negocio */}
      <header
        className="border-b border-border"
        style={{
          background: `linear-gradient(180deg, ${business.primaryColor}1f, transparent)`,
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-12 text-center">
          {business.logo ? (
            <div className="relative size-24 overflow-hidden rounded-2xl border-2 shadow-xl" style={{ borderColor: business.primaryColor }}>
              <Image src={business.logo} alt={business.name} fill className="object-cover" sizes="96px" />
            </div>
          ) : (
            <div
              className="flex size-24 items-center justify-center rounded-2xl text-3xl font-black text-slate-950"
              style={{ backgroundColor: business.primaryColor }}
            >
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold">{business.name}</h1>
            {business.description && (
              <p className="mx-auto mt-2 max-w-xl text-text-muted">{business.description}</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Filtro por categorias */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer",
                activeCategory === null
                  ? "border-transparent font-semibold text-slate-950"
                  : "border-border text-text-muted hover:text-text-primary"
              )}
              style={activeCategory === null ? { backgroundColor: business.primaryColor } : undefined}
            >
              Todo
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer",
                  activeCategory === category.id
                    ? "border-transparent font-semibold text-slate-950"
                    : "border-border text-text-muted hover:text-text-primary"
                )}
                style={
                  activeCategory === category.id
                    ? { backgroundColor: business.primaryColor }
                    : undefined
                }
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Catalogo */}
        {ordered.length === 0 ? (
          <p className="py-20 text-center text-text-muted">
            No hay productos en esta categoria todavia.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {ordered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                businessSlug={business.slug}
                currency={business.currency}
                primaryColor={business.primaryColor}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-border py-6 text-center text-xs text-text-muted">
        Tienda creada con{" "}
        <a href="/" className="font-medium" style={{ color: business.primaryColor }}>
          Listo Pues
        </a>
      </footer>

      <CartDrawer business={business} />
    </div>
  )
}
