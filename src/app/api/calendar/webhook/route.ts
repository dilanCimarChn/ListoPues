import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { sendWhatsAppText } from "@/lib/evolution"
import { formatDateTime } from "@/lib/utils"

/**
 * Webhook de calendario: permite confirmar, cancelar o completar citas
 * desde integraciones externas. Protegido con el secret de la app
 * (header x-webhook-secret = NEXTAUTH_SECRET).
 */

const eventSchema = z.object({
  appointmentId: z.string(),
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-webhook-secret")
    if (!secret || secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Firma invalida" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = eventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 }
      )
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parsed.data.appointmentId },
      include: { business: true },
    })
    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes ?? appointment.notes,
      },
    })

    // Notifica al cliente el cambio de estado de su cita
    const statusText: Record<string, string> = {
      CONFIRMED: "confirmada",
      CANCELLED: "cancelada",
      COMPLETED: "completada",
    }
    await sendWhatsAppText(
      "pro",
      appointment.clientPhone,
      `Hola ${appointment.clientName}! Tu cita de ${appointment.service} en ${appointment.business.name} (${formatDateTime(appointment.date)}) fue ${statusText[parsed.data.status]}.`
    )

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error en webhook de calendario:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
