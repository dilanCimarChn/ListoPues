"use client"

import { useState, type FormEvent } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { formatPrice } from "@/lib/utils"
import { cartTotal } from "@/lib/whatsapp"
import { useCartStore } from "@/store/cart"

const checkoutSchema = z.object({
  clientName: z.string().min(2, "Indica tu nombre"),
  clientPhone: z.string().min(8, "Numero invalido"),
})

interface CheckoutProps {
  open: boolean
  onClose: () => void
  businessSlug: string
  currency: string
}

export function Checkout({ open, onClose, businessSlug, currency }: CheckoutProps) {
  const items = useCartStore((s) => s.items)
  const [form, setForm] = useState({ clientName: "", clientPhone: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)

  const total = cartTotal(items)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError("")

    const result = checkoutSchema.safeParse(form)
    if (!result.success) {
      const map: Record<string, string> = {}
      for (const issue of result.error.issues) {
        map[String(issue.path[0])] = issue.message
      }
      setErrors(map)
      return
    }
    setErrors({})

    setLoading(true)
    try {
      const res = await fetch("/api/pagos/wallbit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug,
          clientName: form.clientName,
          clientPhone: form.clientPhone,
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? "Error creando el pago")
        return
      }
      // Redirige al checkout de Wallbit
      window.location.href = json.data.paymentUrl
    } catch {
      setServerError("Error de conexion. Intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Pagar con Wallbit">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <p className="text-sm text-text-muted">
          Total a pagar:{" "}
          <span className="font-semibold text-text-primary">
            {formatPrice(total, currency)}
          </span>
        </p>
        <Input
          label="Tu nombre"
          name="clientName"
          placeholder="Maria Perez"
          value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          error={errors.clientName}
        />
        <Input
          label="Tu WhatsApp"
          name="clientPhone"
          placeholder="59171234567"
          value={form.clientPhone}
          onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
          error={errors.clientPhone}
        />
        {serverError && (
          <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error">
            {serverError}
          </p>
        )}
        <Button type="submit" className="w-full" loading={loading}>
          Continuar al pago
        </Button>
      </form>
    </Modal>
  )
}
