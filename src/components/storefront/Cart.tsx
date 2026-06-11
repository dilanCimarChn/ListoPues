"use client"

import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/store/cart"

export function Cart({ currency }: { currency: string }) {
  const { items, updateQuantity, removeItem } = useCartStore()

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        Tu carrito esta vacio. Agrega productos del catalogo.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {items.map(({ product, quantity }) => (
        <li key={product.id} className="flex gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-light">
            {product.image && (
              <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
            )}
          </div>
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight">{product.name}</p>
              <button
                onClick={() => removeItem(product.id)}
                className="text-text-muted transition-colors hover:text-error cursor-pointer"
                aria-label={`Quitar ${product.name}`}
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="flex size-7 items-center justify-center rounded-lg border border-border text-sm hover:bg-surface-light cursor-pointer"
                  aria-label="Restar"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="flex size-7 items-center justify-center rounded-lg border border-border text-sm hover:bg-surface-light disabled:opacity-40 cursor-pointer"
                  aria-label="Sumar"
                >
                  +
                </button>
              </div>
              <span className="text-sm font-semibold">
                {formatPrice(product.price * quantity, currency)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
