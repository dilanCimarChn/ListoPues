"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import type { AIContext, FAQ } from "@/types"

const contextSchema = z.object({
  systemPrompt: z.string().min(10, "El prompt es muy corto").max(4000, "Maximo 4000 caracteres"),
  tone: z.string().min(2, "Indica un tono").max(100),
})

interface LaiaEditorProps {
  context: AIContext | null
  businessName: string
}

export function LaiaEditor({ context, businessName }: LaiaEditorProps) {
  const router = useRouter()
  const defaultPrompt = `Eres LAIA, asistente de ${businessName}. Conoces todos los productos, precios y politicas. Eres amigable, concretas ventas y agendas citas. Nunca inventes precios ni disponibilidad que no esten en el contexto.`

  const [form, setForm] = useState({
    systemPrompt: context?.systemPrompt ?? defaultPrompt,
    tone: context?.tone ?? "amigable y profesional",
  })
  const [faqs, setFaqs] = useState<FAQ[]>(context?.faqs ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState("")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  function updateFaq(index: number, field: keyof FAQ, value: string) {
    setFaqs(faqs.map((f, i) => (i === index ? { ...f, [field]: value } : f)))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError("")
    setSaved(false)

    const result = contextSchema.safeParse(form)
    if (!result.success) {
      const map: Record<string, string> = {}
      for (const issue of result.error.issues) {
        map[String(issue.path[0])] = issue.message
      }
      setErrors(map)
      return
    }
    setErrors({})

    const cleanFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim())

    setLoading(true)
    try {
      const res = await fetch("/api/laia/contexto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, faqs: cleanFaqs }),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? "Error guardando el contexto")
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
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Personalidad de LAIA</CardTitle>
          <CardDescription>
            Define como se presenta y se comporta LAIA con tus clientes. Los
            productos y precios se inyectan automaticamente desde tu catalogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Prompt del sistema"
            name="systemPrompt"
            rows={6}
            value={form.systemPrompt}
            onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
            error={errors.systemPrompt}
          />
          <Input
            label="Tono"
            name="tone"
            placeholder="amigable y profesional"
            value={form.tone}
            onChange={(e) => setForm({ ...form, tone: e.target.value })}
            error={errors.tone}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preguntas frecuentes</CardTitle>
          <CardDescription>
            LAIA usara estas respuestas cuando los clientes pregunten por horarios,
            envios, politicas, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border p-4">
              <Input
                name={`faq-q-${i}`}
                placeholder="Pregunta, ej: ¿Hacen envios?"
                value={faq.question}
                onChange={(e) => updateFaq(i, "question", e.target.value)}
              />
              <Textarea
                name={`faq-a-${i}`}
                placeholder="Respuesta"
                rows={2}
                value={faq.answer}
                onChange={(e) => updateFaq(i, "answer", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                className="text-xs text-error hover:underline cursor-pointer"
              >
                Quitar pregunta
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
          >
            Agregar pregunta
          </Button>
        </CardContent>
      </Card>

      {serverError && (
        <p className="rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error">
          {serverError}
        </p>
      )}
      {saved && (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success">
          Contexto de LAIA guardado. Los cambios aplican de inmediato.
        </p>
      )}

      <Button type="submit" loading={loading}>
        Guardar contexto
      </Button>
    </form>
  )
}
