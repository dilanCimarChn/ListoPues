import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentBusiness } from "@/lib/auth"

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(500).nullable().optional(),
  logo: z.string().url().nullable().optional(),
  whatsapp: z.string().min(8).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  currency: z.string().length(3).optional(),
  active: z.boolean().optional(),
})

export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    return NextResponse.json({ data: business })
  } catch (error) {
    console.error("Error obteniendo negocio:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 }
      )
    }

    const data = { ...parsed.data }
    if (data.whatsapp) data.whatsapp = data.whatsapp.replace(/\D/g, "")

    const updated = await prisma.business.update({
      where: { id: business.id },
      data,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error actualizando negocio:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
