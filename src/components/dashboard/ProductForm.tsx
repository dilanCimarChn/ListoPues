"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import type { Category, Product } from "@/types"

const productSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().max(500, "Maximo 500 caracteres"),
  price: z.number({ message: "Indica un precio valido" }).positive("El precio debe ser mayor a 0"),
  stock: z.number({ message: "Indica un stock valido" }).int().min(0, "El stock no puede ser negativo"),
})

interface ProductFormProps {
  categories: Category[]
  product?: Product
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price?.toString() ?? "",
    stock: product?.stock?.toString() ?? "0",
    categoryId: product?.categoryId ?? "",
    featured: product?.featured ?? false,
  })
  const [image, setImage] = useState<string | null>(product?.image ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  function parsedValues() {
    return {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock || "0", 10),
    }
  }

  function validateField(field: string) {
    const result = productSchema.safeParse(parsedValues())
    if (result.success) {
      setErrors({})
      return
    }
    const issue = result.error.issues.find((i) => i.path[0] === field)
    setErrors((prev) => ({ ...prev, [field]: issue?.message ?? "" }))
  }

  async function onUpload(file: File) {
    setUploading(true)
    setServerError("")
    try {
      const data = new FormData()
      data.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: data })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? "Error subiendo la imagen")
        return
      }
      setImage(json.data.url)
    } catch {
      setServerError("Error de conexion subiendo la imagen")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError("")

    const values = parsedValues()
    const result = productSchema.safeParse(values)
    if (!result.success) {
      const map: Record<string, string> = {}
      for (const issue of result.error.issues) {
        map[String(issue.path[0])] = issue.message
      }
      setErrors(map)
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...result.data,
        description: result.data.description || null,
        image,
        categoryId: form.categoryId || null,
        featured: form.featured,
        available: values.stock > 0,
      }

      const res = await fetch(
        product ? `/api/productos/${product.id}` : "/api/productos",
        {
          method: product ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? "Error guardando el producto")
        return
      }

      router.push("/dashboard/productos")
      router.refresh()
    } catch {
      setServerError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Input
            label="Nombre del producto"
            name="name"
            placeholder="Torta de chocolate"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value })
            }}
            onBlur={() => validateField("name")}
            error={errors.name}
          />

          <Textarea
            label="Descripcion (opcional)"
            name="description"
            placeholder="Describe tu producto..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={errors.description}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Precio"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="150"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              onBlur={() => validateField("price")}
              error={errors.price}
            />
            <Input
              label="Stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              placeholder="10"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              onBlur={() => validateField("stock")}
              error={errors.stock}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="categoryId" className="block text-sm font-medium text-text-muted">
              Categoria (opcional)
            </label>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
            >
              <option value="">Sin categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-text-muted">Foto del producto</span>
            <div className="flex items-center gap-4">
              {image ? (
                <div className="relative size-24 overflow-hidden rounded-xl border border-border">
                  <Image src={image} alt="Vista previa" fill className="object-cover" sizes="96px" />
                </div>
              ) : (
                <div className="flex size-24 items-center justify-center rounded-xl border border-dashed border-border text-text-muted">
                  <svg className="size-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
              )}
              <div className="space-y-2">
                <label className="inline-block cursor-pointer rounded-xl border border-border bg-surface-light px-4 py-2 text-sm transition-colors hover:bg-surface-light/70">
                  {uploading ? "Subiendo..." : image ? "Cambiar foto" : "Subir foto"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onUpload(file)
                    }}
                  />
                </label>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="block text-xs text-error hover:underline cursor-pointer"
                  >
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="size-4 accent-[#22C55E]"
            />
            Destacar en la vitrina
          </label>

          {serverError && (
            <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error">
              {serverError}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={loading || uploading}>
              {product ? "Guardar cambios" : "Crear producto"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
