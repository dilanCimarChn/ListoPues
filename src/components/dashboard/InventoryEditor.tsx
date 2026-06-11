"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, type Column } from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { formatPrice } from "@/lib/utils"

export interface InventoryRow {
  id: string
  name: string
  price: number
  stock: number
  available: boolean
}

export function InventoryEditor({
  products,
  currency,
}: {
  products: InventoryRow[]
  currency: string
}) {
  const router = useRouter()
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function onSave(productId: string) {
    const value = parseInt(edits[productId] ?? "", 10)
    if (isNaN(value) || value < 0) {
      setError("El stock debe ser un numero mayor o igual a 0")
      return
    }
    setSavingId(productId)
    setError("")
    try {
      const res = await fetch("/api/inventario", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, stock: value }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Error actualizando el stock")
        return
      }
      setEdits((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
      router.refresh()
    } catch {
      setError("Error de conexion")
    } finally {
      setSavingId(null)
    }
  }

  const columns: Column<InventoryRow>[] = [
    {
      header: "Producto",
      render: (p) => <span className="font-medium text-text-primary">{p.name}</span>,
    },
    {
      header: "Precio",
      render: (p) => formatPrice(p.price, currency),
    },
    {
      header: "Estado",
      render: (p) =>
        !p.available || p.stock === 0 ? (
          <Badge variant="error">Agotado</Badge>
        ) : p.stock <= 5 ? (
          <Badge variant="warning">Stock bajo</Badge>
        ) : (
          <Badge variant="success">OK</Badge>
        ),
    },
    {
      header: "Stock",
      render: (p) => (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={edits[p.id] ?? p.stock}
            onChange={(e) => setEdits({ ...edits, [p.id]: e.target.value })}
            className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
          {edits[p.id] !== undefined && edits[p.id] !== String(p.stock) && (
            <Button size="sm" loading={savingId === p.id} onClick={() => onSave(p.id)}>
              Guardar
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error">
          {error}
        </p>
      )}
      <Table
        columns={columns}
        data={products}
        rowKey={(p) => p.id}
        emptyMessage="Sin productos en el inventario."
      />
    </div>
  )
}
