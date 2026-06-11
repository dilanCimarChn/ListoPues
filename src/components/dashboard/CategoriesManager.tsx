"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

export interface CategoryWithCount {
  id: string
  name: string
  _count: { products: number }
}

export function CategoriesManager({ categories }: { categories: CategoryWithCount[] }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      setError("El nombre es muy corto")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Error creando la categoria")
        return
      }
      setName("")
      router.refresh()
    } catch {
      setError("Error de conexion")
    } finally {
      setLoading(false)
    }
  }

  async function onDelete(id: string) {
    setDeletingId(id)
    setError("")
    try {
      const res = await fetch(`/api/categorias?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Error eliminando la categoria")
        return
      }
      router.refresh()
    } catch {
      setError("Error de conexion")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardContent>
          <form onSubmit={onCreate} className="flex gap-3">
            <div className="flex-1">
              <Input
                name="name"
                placeholder="Nombre de la categoria, ej: Tortas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={error || undefined}
              />
            </div>
            <Button type="submit" loading={loading}>
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            Aun no tienes categorias. Crea la primera para organizar tu catalogo.
          </p>
        ) : (
          categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="muted">
                    {category._count.products} producto{category._count.products === 1 ? "" : "s"}
                  </Badge>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletingId === category.id}
                  onClick={() => onDelete(category.id)}
                >
                  Eliminar
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
