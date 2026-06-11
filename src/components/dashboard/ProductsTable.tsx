"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Table, type Column } from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/types"

interface ProductsTableProps {
  products: Product[]
  currency: string
}

export function ProductsTable({ products, currency }: ProductsTableProps) {
  const router = useRouter()
  const [toDelete, setToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function onDelete() {
    if (!toDelete) return
    setDeleting(true)
    setError("")
    try {
      const res = await fetch(`/api/productos/${toDelete.id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Error eliminando el producto")
        return
      }
      setToDelete(null)
      router.refresh()
    } catch {
      setError("Error de conexion")
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Product>[] = [
    {
      header: "Producto",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.image ? (
            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border">
              <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40px" />
            </div>
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-light text-xs text-text-muted">
              —
            </div>
          )}
          <div>
            <p className="font-medium text-text-primary">{p.name}</p>
            {p.category && <p className="text-xs text-text-muted">{p.category.name}</p>}
          </div>
        </div>
      ),
    },
    {
      header: "Precio",
      render: (p) => formatPrice(p.price, currency),
    },
    {
      header: "Stock",
      render: (p) => p.stock,
    },
    {
      header: "Estado",
      render: (p) =>
        p.available && p.stock > 0 ? (
          <Badge variant="success">Disponible</Badge>
        ) : (
          <Badge variant="error">Agotado</Badge>
        ),
    },
    {
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/productos/nuevo?id=${p.id}`)}
          >
            Editar
          </Button>
          <Button variant="danger" size="sm" onClick={() => setToDelete(p)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Table
        columns={columns}
        data={products}
        rowKey={(p) => p.id}
        emptyMessage="Aun no tienes productos. Crea el primero con el boton de arriba."
      />

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Eliminar producto"
      >
        <p className="text-sm text-text-muted">
          ¿Seguro que quieres eliminar &quot;{toDelete?.name}&quot;? Esta accion no se
          puede deshacer.
        </p>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleting} onClick={onDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  )
}
