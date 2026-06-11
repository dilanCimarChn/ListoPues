"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  pageSize?: number
  emptyMessage?: string
}

export function Table<T>({
  columns,
  data,
  rowKey,
  pageSize = 10,
  emptyMessage = "No hay registros todavia.",
}: TableProps<T>) {
  const [page, setPage] = useState(0)

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const rows = data.slice(safePage * pageSize, (safePage + 1) * pageSize)

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light/30">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={cn("px-4 py-3 font-medium text-text-muted", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-surface-light/20"
                >
                  {columns.map((col) => (
                    <td key={col.header} className={cn("px-4 py-3", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border bg-surface-light/20 px-4 py-2">
          <span className="text-xs text-text-muted">
            Pagina {safePage + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
