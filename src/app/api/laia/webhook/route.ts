import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  isValidEvolutionRequest,
  parseEvolutionWebhook,
  phoneFromJid,
  sendWhatsAppText,
} from "@/lib/evolution"
import { runLaia } from "@/lib/ai-agent"

/**
 * Webhook de LAIA (plan Pro).
 * Evolution API envia aqui los mensajes de los clientes a la instancia "pro".
 * El negocio se identifica por query param: /api/laia/webhook?negocio=[slug]
 */
export async function POST(request: Request) {
  try {
    if (!isValidEvolutionRequest(request)) {
      return NextResponse.json({ error: "Firma invalida" }, { status: 401 })
    }

    const slug = new URL(request.url).searchParams.get("negocio")
    if (!slug) {
      return NextResponse.json(
        { error: "Falta el parametro ?negocio=[slug]" },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { slug },
      include: { aiContext: true },
    })

    if (!business || !business.active) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }
    if (business.plan !== "PRO") {
      return NextResponse.json(
        { error: "LAIA solo esta disponible en el plan Pro" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const message = parseEvolutionWebhook(body)

    if (!message || message.fromMe) {
      return NextResponse.json({ data: { ignored: true } })
    }

    const clientPhone = phoneFromJid(message.remoteJid)

    // El dueno escribe a su propia instancia: lo ignoramos, LAIA es para clientes
    if (clientPhone === business.whatsapp) {
      return NextResponse.json({ data: { ignored: true } })
    }

    const reply = await runLaia(business, clientPhone, message.text)
    await sendWhatsAppText("pro", clientPhone, reply)

    return NextResponse.json({ data: { ok: true } })
  } catch (error) {
    console.error("Error en webhook de LAIA:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
