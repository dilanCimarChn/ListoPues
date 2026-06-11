"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { formatPrice, cn } from "@/lib/utils"
import { buildWhatsAppUrl, cartTotal } from "@/lib/whatsapp"
import { useCartStore } from "@/store/cart"
import { Cart } from "@/components/storefront/Cart"
import { Checkout } from "@/components/storefront/Checkout"
import type { Business } from "@/types"

export function CartDrawer({ business }: { business: Business }) {
  const { items, clearCart } = useCartStore()
  const [open, setOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Evita hidratacion incorrecta del contador (persistido en localStorage)
  useEffect(() => setMounted(true), [])

  const count = mounted ? items.reduce((sum, i) => sum + i.quantity, 0) : 0
  const total = mounted ? cartTotal(items) : 0

  function orderByWhatsApp() {
    const url = buildWhatsAppUrl({
      businessName: business.name,
      whatsappNumber: business.whatsapp,
      currency: business.currency,
      items,
    })
    window.open(url, "_blank")
    clearCart()
    setOpen(false)
  }

  return (
    <>
      {/* Boton flotante del carrito */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 font-semibold text-slate-950 shadow-xl transition-transform hover:scale-105 cursor-pointer"
        style={{ backgroundColor: business.primaryColor }}
        aria-label="Abrir carrito"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        {count > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer lateral */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Carrito de compras"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Mi pedido</h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-text-muted hover:bg-surface-light hover:text-text-primary cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <Cart currency={business.currency} />
        </div>

        {count > 0 && (
          <div className="space-y-3 border-t border-border p-5">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total</span>
              <span className="text-lg font-bold">
                {formatPrice(total, business.currency)}
              </span>
            </div>
            <Button className="w-full" size="lg" onClick={orderByWhatsApp}>
              Pedir por WhatsApp
            </Button>
            <Button
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={() => setCheckoutOpen(true)}
            >
              Pagar online con Wallbit
            </Button>
          </div>
        )}
      </aside>

      <Checkout
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        businessSlug={business.slug}
        currency={business.currency}
      />
    </>
  )
}
