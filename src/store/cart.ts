import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, Product } from "@/types"

interface CartState {
  items: CartItem[]
  businessSlug: string | null
  addItem: (product: Product, businessSlug: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      businessSlug: null,

      addItem: (product, businessSlug) => {
        const { items, businessSlug: currentSlug } = get()

        // Si el carrito pertenece a otro negocio, lo limpia primero
        if (currentSlug && currentSlug !== businessSlug) {
          set({ items: [], businessSlug })
        }

        const existing = items.find((i) => i.product.id === product.id)
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          set({
            items: [...get().items, { product, quantity: 1 }],
            businessSlug,
          })
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.product.id !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [], businessSlug: null }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "lp-cart" }
  )
)
