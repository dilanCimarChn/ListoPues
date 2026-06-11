import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentBusiness } from "@/lib/auth"

const updateSchema = z.object({
  appointmentId: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
})

export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const appointments = await prisma.appointment.findMany({
      where: { businessId: business.id },
      orderBy: { date: "asc" },
    })
    return NextResponse.json({ data: appointments })
  } catch (error) {
    console.error("Error listando citas:", error)
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

    const appointment = await prisma.appointment.findFirst({
      where: { id: parsed.data.appointmentId, businessId: business.id },
    })
    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: parsed.data.status },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error actualizando cita:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
