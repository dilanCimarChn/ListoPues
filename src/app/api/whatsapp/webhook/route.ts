import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  isValidEvolutionRequest,
  parseEvolutionWebhook,
  phoneFromJid,
  sendWhatsAppText,
} from "@/lib/evolution"
import { handleOwnerCommand } from "@/lib/whatsapp-bot"

/**
 * Webhook del bot del dueno (plan Lite).
 * Evolution API envia aqui los mensajes que recibe la instancia "lite".
 * Solo responde a numeros registrados como WhatsApp de un negocio.
 */
export async function POST(request: Request) {
  try {
    if (!isValidEvolutionRequest(request)) {
      return NextResponse.json({ error: "Firma invalida" }, { status: 401 })
    }

    const body = await request.json()
    const message = parseEvolutionWebhook(body)

    // Ignora eventos sin texto o mensajes enviados por el propio bot
    if (!message || message.fromMe) {
      return NextResponse.json({ data: { ignored: true } })
    }

    const phone = phoneFromJid(message.remoteJid)

    const business = await prisma.business.findFirst({
      where: { whatsapp: phone, active: true },
    })

    if (!business) {
      // Numero desconocido: no respondemos para evitar spam
      return NextResponse.json({ data: { ignored: true } })
    }

    const reply = await handleOwnerCommand(business, message.text)
    await sendWhatsAppText("lite", phone, reply)

    return NextResponse.json({ data: { ok: true } })
  } catch (error) {
    console.error("Error en webhook de WhatsApp Lite:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
