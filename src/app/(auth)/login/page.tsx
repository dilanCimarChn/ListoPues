"use client"

import { Suspense, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
})

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"

  const [form, setForm] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(false)

  function validate(field: string, value: string) {
    const next = { ...form, [field]: value }
    setForm(next)
    const result = loginSchema.safeParse(next)
    if (result.success) {
      setErrors({})
      return
    }
    const fieldError = result.error.issues.find((i) => i.path[0] === field)
    setErrors((prev) => ({ ...prev, [field]: fieldError?.message ?? "" }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError("")

    const result = loginSchema.safeParse(form)
    if (!result.success) {
      const map: Record<string, string> = {}
      for (const issue of result.error.issues) {
        map[String(issue.path[0])] = issue.message
      }
      setErrors(map)
      return
    }

    setLoading(true)
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    })
    setLoading(false)

    if (res?.error) {
      setServerError("Email o contrasena incorrectos")
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-text-muted">
            Ingresa a tu cuenta para administrar tu negocio
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={(e) => validate("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Contrasena"
            name="password"
            type="password"
            placeholder="********"
            value={form.password}
            onChange={(e) => validate("password", e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          {serverError && (
            <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Iniciar sesion
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-primary hover:underline">
            Crea tu tienda gratis
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
