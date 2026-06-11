import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentBusiness } from "@/lib/auth"

const contextSchema = z.object({
  systemPrompt: z.string().min(10, "El prompt es muy corto").max(4000),
  tone: z.string().min(2).max(100),
  faqs: z
    .array(
      z.object({
        question: z.string().min(3),
        answer: z.string().min(3),
      })
    )
    .max(30),
})

export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    if (business.plan !== "PRO") {
      return NextResponse.json({ error: "Disponible solo en el plan Pro" }, { status: 403 })
    }

    return NextResponse.json({ data: business.aiContext })
  } catch (error) {
    console.error("Error obteniendo contexto LAIA:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const business = await getCurrentBusiness()
    if (!business) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    if (business.plan !== "PRO") {
      return NextResponse.json({ error: "Disponible solo en el plan Pro" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = contextSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 }
      )
    }

    const context = await prisma.aIContext.upsert({
      where: { businessId: business.id },
      update: parsed.data,
      create: { ...parsed.data, businessId: business.id },
    })

    return NextResponse.json({ data: context })
  } catch (error) {
    console.error("Error guardando contexto LAIA:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
