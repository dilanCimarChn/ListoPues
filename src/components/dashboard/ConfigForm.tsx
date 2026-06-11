"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import type { Business } from "@/types"

const configSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().max(500, "Maximo 500 caracteres"),
  whatsapp: z.string().min(8, "Numero invalido"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color invalido"),
  currency: z.string().length(3, "Usa el codigo de 3 letras, ej: BOB"),
})

const CURRENCIES = ["BOB", "COP", "USD", "PEN", "MXN", "ARS"]

export function ConfigForm({ business }: { business: Business }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: business.name,
    description: business.description ?? "",
    whatsapp: business.whatsapp,
    primaryColor: business.primaryColor,
    currency: business.currency,
  })
  const [logo, setLogo] = useState<string | null>(business.logo)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  function validateField(field: string) {
    const result = configSchema.safeParse(form)
    if (result.success) {
      setErrors({})
      return
    }
    const issue = result.error.issues.find((i) => i.path[0] === field)
    setErrors((prev) => ({ ...prev, [field]: issue?.message ?? "" }))
  }

  async function onUploadLogo(file: File) {
    setUploading(true)
    setServerError("")
    try {
      const data = new FormData()
      data.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: data })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? "Error subiendo el logo")
        return
      }
      setLogo(json.data.url)
    } catch {
      setServerError("Error de conexion subiendo el logo")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError("")
    setSaved(false)

    const result = configSchema.safeParse(form)
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
      const res = await fetch("/api/negocios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          description: result.data.description || null,
          logo,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? "Error guardando los cambios")
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setServerError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Datos del negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nombre del negocio"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onBlur={() => validateField("name")}
            error={errors.name}
          />
          <Textarea
            label="Descripcion"
            name="description"
            placeholder="Cuenta de que trata tu negocio..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={errors.description}
          />
          <Input
            label="WhatsApp (con codigo de pais)"
            name="whatsapp"
            placeholder="59171234567"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            onBlur={() => validateField("whatsapp")}
            error={errors.whatsapp}
          />
          <div className="space-y-1.5">
            <label htmlFor="currency" className="block text-sm font-medium text-text-muted">
              Moneda
            </label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-text-muted">Logo</span>
            <div className="flex items-center gap-4">
              {logo ? (
                <div className="relative size-20 overflow-hidden rounded-xl border border-border">
                  <Image src={logo} alt="Logo" fill className="object-cover" sizes="80px" />
                </div>
              ) : (
                <div className="flex size-20 items-center justify-center rounded-xl border border-dashed border-border text-xs text-text-muted">
                  Sin logo
                </div>
              )}
              <label className="inline-block cursor-pointer rounded-xl border border-border bg-surface-light px-4 py-2 text-sm transition-colors hover:bg-surface-light/70">
                {uploading ? "Subiendo..." : "Subir logo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onUploadLogo(file)
                  }}
                />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="primaryColor" className="block text-sm font-medium text-text-muted">
              Color primario de tu vitrina
            </label>
            <div className="flex items-center gap-3">
              <input
                id="primaryColor"
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="h-10 w-16 cursor-pointer rounded-lg border border-border bg-background"
              />
              <Input
                name="primaryColorText"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                onBlur={() => validateField("primaryColor")}
                error={errors.primaryColor}
                className="w-32"
              />
              {/* Preview en tiempo real */}
              <span
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-950"
                style={{ backgroundColor: form.primaryColor }}
              >
                Vista previa
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error">
          {serverError}
        </p>
      )}
      {saved && (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success">
          Cambios guardados correctamente.
        </p>
      )}

      <Button type="submit" loading={loading || uploading}>
        Guardar configuracion
      </Button>
    </form>
  )
}
