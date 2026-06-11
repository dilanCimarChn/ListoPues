import type { CartItem, WhatsAppOrderPayload } from "@/types"
import { formatPrice } from "@/lib/utils"

export function buildOrderMessage(payload: WhatsAppOrderPayload): string {
  const { businessName, currency, items, paid } = payload

  const lines = items.map((item) => {
    const subtotal = item.product.price * item.quantity
    return `• ${item.quantity}x ${item.product.name} — ${formatPrice(subtotal, currency)}`
  })

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const message = [
    `Hola ${businessName}! 👋`,
    `Quisiera hacer el siguiente pedido:`,
    ``,
    `🛍️ Mi Pedido:`,
    ...lines,
    ``,
    `💰 Total: ${formatPrice(total, currency)}`,
    ``,
    `¿Me confirmas disponibilidad y forma de pago? 🙏`,
  ]

  if (paid) {
    message.push(``, `✅ Pago realizado - Comprobante adjunto`)
  }

  return message.join("\n")
}

export function buildWhatsAppUrl(payload: WhatsAppOrderPayload): string {
  const message = buildOrderMessage(payload)
  const phone = payload.whatsappNumber.replace(/\D/g, "")
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
}
