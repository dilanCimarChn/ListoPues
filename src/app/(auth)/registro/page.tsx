"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"

const registerSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
  businessName: z.string().min(2, "El nombre del negocio es muy corto"),
  whatsapp: z
    .string()
    .min(8, "Numero invalido")
    .regex(/^\+?[\d\s-]+$/, "Solo numeros, ej: 59171234567"),
})

type FormState = z.infer<typeof registerSchema>

const INITIAL: FormState = {
  name: "",
  email: "",
  password: "",
  businessName: "",
  whatsapp: "",
}

export default function RegistroPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)

  function update(field: keyof FormState, value: string) {
    const next = { ...form, [field]: value }
    setForm(next)

    const result = registerSchema.safeParse(next)
    if (result.success) {
      setErrors({})
      return
    }
    const fieldError = result.error.issues.find((i) => i.path[0] === field)
    setErrors((prev) => ({ ...prev, [field]: fieldError?.message }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError("")

    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const map: Partial<Record<keyof FormState, string>> = {}
      for (const issue of result.error.issues) {
        map[issue.path[0] as keyof FormState] = issue.message
      }
      setErrors(map)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error ?? "Error creando la cuenta")
        return
      }

      // Inicia sesion automaticamente tras el registro
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      router.push("/dashboard")
      router.refresh()
    } catch {
      setServerError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Crea tu tienda</h1>
          <p className="mt-1 text-sm text-text-muted">
            En menos de 5 minutos tu vitrina esta lista
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            label="Tu nombre"
            name="name"
            placeholder="Maria Perez"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            error={errors.name}
            autoComplete="name"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Contrasena"
            name="password"
            type="password"
            placeholder="Minimo 6 caracteres"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="Nombre de tu negocio"
            name="businessName"
            placeholder="Dulces Maria"
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            error={errors.businessName}
          />
          <Input
            label="WhatsApp del negocio"
            name="whatsapp"
            placeholder="59171234567"
            value={form.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            error={errors.whatsapp}
            autoComplete="tel"
          />

          {serverError && (
            <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Crear mi tienda
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesion
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
