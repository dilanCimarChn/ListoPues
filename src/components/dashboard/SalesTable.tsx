"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, type Column } from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { formatDateTime, formatPrice } from "@/lib/utils"
import type { Sale, SaleStatus } from "@/types"

const STATUS_LABEL: Record<SaleStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagada",
  DELIVERED: "Entregada",
  CANCELLED: "Cancelada",
}

const STATUS_VARIANT: Record<SaleStatus, "warning" | "success" | "default" | "error"> = {
  PENDING: "warning",
  PAID: "success",
  DELIVERED: "default",
  CANCELLED: "error",
}

export function SalesTable({ sales, currency }: { sales: Sale[]; currency: string }) {
  const router = useRouter()
  const [detail, setDetail] = useState<Sale | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function updateStatus(saleId: string, status: SaleStatus) {
    setSavingId(saleId)
    try {
      await fetch("/api/ventas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId, status }),
      })
      router.refresh()
    } finally {
      setSavingId(null)
    }
  }

  const columns: Column<Sale>[] = [
    {
      header: "Cliente",
      render: (s) => (
        <div>
          <p className="font-medium text-text-primary">{s.clientName}</p>
          <p className="text-xs text-text-muted">{s.clientPhone}</p>
        </div>
      ),
    },
    { header: "Fecha", render: (s) => formatDateTime(s.createdAt) },
    { header: "Total", render: (s) => formatPrice(s.total, currency) },
    {
      header: "Estado",
      render: (s) => <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>,
    },
    {
      header: "",
      className: "text-right",
      render: (s) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDetail(s)}>
            Detalle
          </Button>
          {s.status === "PAID" && (
            <Button
              size="sm"
              variant="secondary"
              loading={savingId === s.id}
              onClick={() => updateStatus(s.id, "DELIVERED")}
            >
              Entregar
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Table
        columns={columns}
        data={sales}
        rowKey={(s) => s.id}
        emptyMessage="Aun no tienes ventas registradas."
      />

      <Modal open={detail !== null} onClose={() => setDetail(null)} title="Detalle de venta">
        {detail && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">{detail.clientName}</p>
              <p className="text-text-muted">{detail.clientPhone}</p>
              <p className="text-xs text-text-muted">{formatDateTime(detail.createdAt)}</p>
            </div>
            <ul className="space-y-2 rounded-xl border border-border p-4">
              {detail.items.map((item) => (
                <li key={item.productId} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatPrice(item.price * item.quantity, currency)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span>{formatPrice(detail.total, currency)}</span>
              </li>
            </ul>
            {detail.receiptUrl && (
              <a
                href={detail.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Ver comprobante de pago
              </a>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
