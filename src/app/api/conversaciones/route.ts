import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentBusiness } from "@/lib/auth"

const updateSchema = z.object({
  conversationId: z.string(),
  status: z.enum(["ACTIVE", "RESOLVED", "ESCALATED"]),
})

export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const conversations = await prisma.conversation.findMany({
      where: { businessId: business.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ data: conversations })
  } catch (error) {
    console.error("Error listando conversaciones:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const business = await getCurrentBusiness()
    if (!business) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 })
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: parsed.data.conversationId, businessId: business.id },
    })
    if (!conversation) {
      return NextResponse.json({ error: "Conversacion no encontrada" }, { status: 404 })
    }

    const updated = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: parsed.data.status },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error actualizando conversacion:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
