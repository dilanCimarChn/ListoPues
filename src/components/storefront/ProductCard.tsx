"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/Badge"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
  businessSlug: string
  currency: string
  primaryColor: string
}

export function ProductCard({ product, businessSlug, currency, primaryColor }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const soldOut = !product.available || product.stock === 0

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-transform hover:-translate-y-1">
      <div className="relative aspect-square bg-surface-light">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            <svg className="size-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Badge variant="error" className="text-sm">
              Agotado
            </Badge>
          </div>
        )}
        {product.featured && !soldOut && (
          <Badge variant="warning" className="absolute left-2 top-2">
            Destacado
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-tight">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-text-muted">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{formatPrice(product.price, currency)}</span>
          <button
            disabled={soldOut}
            onClick={() => addItem(product, businessSlug)}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  )
}
