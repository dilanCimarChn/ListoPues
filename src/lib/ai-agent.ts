import Anthropic from "@anthropic-ai/sdk"
import type { Business, AIContext } from "@prisma/client"
import { prisma } from "@/lib/db"
import { sendWhatsAppText } from "@/lib/evolution"
import { createPaymentSession } from "@/lib/wallbit"
import { formatPrice, formatDateTime } from "@/lib/utils"
import type { ChatMessage, FAQ, SaleItem } from "@/types"

/**
 * LAIA — agente IA del plan Pro. Atiende a los clientes del negocio
 * por WhatsApp: responde preguntas, agenda citas y genera links de pago.
 */

const MODEL = "claude-sonnet-4-6"
const MAX_TOOL_ROUNDS = 4
const HISTORY_LIMIT = 20

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type BusinessWithContext = Business & { aiContext: AIContext | null }

async function buildSystemPrompt(business: BusinessWithContext): Promise<string> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: business.id, available: true },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ where: { businessId: business.id } }),
  ])

  const productLines = products.map((p) => {
    const cat = p.category ? ` [${p.category.name}]` : ""
    const stock = p.stock > 0 ? `stock: ${p.stock}` : "AGOTADO"
    return `- ${p.name}${cat} — ${formatPrice(p.price, business.currency)} (${stock}) (id: ${p.id})`
  })

  const faqs = (business.aiContext?.faqs as unknown as FAQ[] | null) ?? []
  const faqLines = faqs.map((f) => `P: ${f.question}\nR: ${f.answer}`)

  const base =
    business.aiContext?.systemPrompt?.trim() ||
    `Eres LAIA, asistente de ${business.name}. Conoces todos los productos, precios y politicas. Eres amigable, concretas ventas y agendas citas. Nunca inventes precios ni disponibilidad que no esten en el contexto.`

  return [
    base,
    ``,
    `Tono de comunicacion: ${business.aiContext?.tone ?? "amigable y profesional"}.`,
    `Responde siempre en espanol, con mensajes cortos aptos para WhatsApp (sin markdown).`,
    ``,
    `=== NEGOCIO ===`,
    `Nombre: ${business.name}`,
    business.description ? `Descripcion: ${business.description}` : ``,
    `Moneda: ${business.currency}`,
    ``,
    `=== CATEGORIAS ===`,
    categories.length > 0 ? categories.map((c) => `- ${c.name}`).join("\n") : `(sin categorias)`,
    ``,
    `=== PRODUCTOS DISPONIBLES ===`,
    productLines.length > 0 ? productLines.join("\n") : `(sin productos cargados)`,
    ``,
    faqLines.length > 0 ? `=== PREGUNTAS FRECUENTES ===\n${faqLines.join("\n\n")}` : ``,
    ``,
    `Reglas:`,
    `- Nunca inventes precios, productos ni disponibilidad fuera de este contexto.`,
    `- Para agendar una cita usa la herramienta consultar_disponibilidad y luego agendar_cita.`,
    `- Cuando el cliente confirme una compra usa crear_link_pago y envia el link.`,
    `- Si no puedes resolver algo, dile al cliente que un humano lo contactara pronto.`,
  ].join("\n")
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "consultar_disponibilidad",
    description:
      "Consulta las citas ya agendadas en una fecha para saber que horarios estan ocupados. Usar antes de agendar.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Fecha a consultar en formato YYYY-MM-DD" },
      },
      required: ["date"],
    },
  },
  {
    name: "agendar_cita",
    description: "Agenda una cita para el cliente una vez confirmados fecha, hora y servicio.",
    input_schema: {
      type: "object",
      properties: {
        clientName: { type: "string", description: "Nombre del cliente" },
        datetime: { type: "string", description: "Fecha y hora en formato ISO 8601, ej: 2026-06-15T15:00:00" },
        service: { type: "string", description: "Servicio solicitado" },
        notes: { type: "string", description: "Notas adicionales (opcional)" },
      },
      required: ["clientName", "datetime", "service"],
    },
  },
  {
    name: "crear_link_pago",
    description:
      "Crea un link de pago Wallbit para los productos que el cliente confirmo comprar. Devuelve la URL para enviarla al cliente.",
    input_schema: {
      type: "object",
      properties: {
        clientName: { type: "string", description: "Nombre del cliente" },
        items: {
          type: "array",
          description: "Productos confirmados",
          items: {
            type: "object",
            properties: {
              productId: { type: "string", description: "id del producto (del contexto)" },
              quantity: { type: "number", description: "cantidad" },
            },
            required: ["productId", "quantity"],
          },
        },
      },
      required: ["clientName", "items"],
    },
  },
]

interface ToolResultPayload {
  result: string
}

async function executeTool(
  business: BusinessWithContext,
  clientPhone: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<ToolResultPayload> {
  switch (toolName) {
    case "consultar_disponibilidad": {
      const date = String(input.date ?? "")
      const start = new Date(`${date}T00:00:00`)
      const end = new Date(`${date}T23:59:59`)
      if (isNaN(start.getTime())) return { result: "Fecha invalida, usa formato YYYY-MM-DD." }

      const appointments = await prisma.appointment.findMany({
        where: {
          businessId: business.id,
          date: { gte: start, lte: end },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        orderBy: { date: "asc" },
      })

      if (appointments.length === 0) {
        return { result: `No hay citas agendadas el ${date}. Todos los horarios estan libres.` }
      }

      const busy = appointments
        .map((a) => a.date.toISOString().slice(11, 16))
        .join(", ")
      return { result: `Horarios ocupados el ${date}: ${busy}` }
    }

    case "agendar_cita": {
      const datetime = new Date(String(input.datetime ?? ""))
      if (isNaN(datetime.getTime())) return { result: "Fecha y hora invalidas, usa formato ISO 8601." }

      const appointment = await prisma.appointment.create({
        data: {
          clientName: String(input.clientName ?? "Cliente"),
          clientPhone,
          date: datetime,
          service: String(input.service ?? ""),
          notes: input.notes ? String(input.notes) : null,
          businessId: business.id,
        },
      })

      await sendWhatsAppText(
        "pro",
        business.whatsapp,
        `Nueva cita agendada por LAIA:\n${appointment.clientName} (${clientPhone})\n${appointment.service}\n${formatDateTime(appointment.date)}`
      )

      return {
        result: `Cita agendada con exito para ${formatDateTime(datetime)} (id ${appointment.id}). Confirma al cliente.`,
      }
    }

    case "crear_link_pago": {
      const rawItems = (input.items as { productId: string; quantity: number }[]) ?? []
      if (rawItems.length === 0) return { result: "No se indicaron productos." }

      const products = await prisma.product.findMany({
        where: {
          id: { in: rawItems.map((i) => i.productId) },
          businessId: business.id,
          available: true,
        },
      })

      if (products.length === 0) {
        return { result: "Ninguno de los productos indicados existe o esta disponible." }
      }

      const saleItems: SaleItem[] = []
      let total = 0
      for (const item of rawItems) {
        const product = products.find((p) => p.id === item.productId)
        if (!product) continue
        const quantity = Math.max(1, Math.floor(item.quantity))
        saleItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
        })
        total += product.price * quantity
      }

      if (saleItems.length === 0) return { result: "Productos invalidos." }

      const sale = await prisma.sale.create({
        data: {
          clientName: String(input.clientName ?? "Cliente"),
          clientPhone,
          total,
          items: saleItems as unknown as object,
          businessId: business.id,
        },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      const session = await createPaymentSession({
        amount: total,
        currency: business.currency,
        description: `Pedido en ${business.name} (${saleItems.length} productos)`,
        reference: sale.id,
        successUrl: `${appUrl}/${business.slug}?pago=exitoso`,
        cancelUrl: `${appUrl}/${business.slug}?pago=cancelado`,
      })

      await sendWhatsAppText(
        "pro",
        business.whatsapp,
        `Nueva venta iniciada por LAIA:\n${sale.clientName} (${clientPhone})\nTotal: ${formatPrice(total, business.currency)}\nEstado: pendiente de pago`
      )

      return {
        result: `Link de pago creado: ${session.paymentUrl} — Total ${formatPrice(total, business.currency)}. Envia el link al cliente.`,
      }
    }

    default:
      return { result: `Herramienta desconocida: ${toolName}` }
  }
}

/**
 * Procesa un mensaje de cliente y devuelve la respuesta de LAIA.
 * Persiste el historial en la tabla Conversation.
 */
export async function runLaia(
  business: BusinessWithContext,
  clientPhone: string,
  userMessage: string
): Promise<string> {
  let convo = await prisma.conversation.findFirst({
    where: { businessId: business.id, clientPhone, status: { not: "RESOLVED" } },
    orderBy: { updatedAt: "desc" },
  })

  if (!convo) {
    convo = await prisma.conversation.create({
      data: { clientPhone, businessId: business.id },
    })
  }

  const history = ((convo.messages as unknown as ChatMessage[]) ?? []).slice(
    -HISTORY_LIMIT
  )

  const systemPrompt = await buildSystemPrompt(business)

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ]

  let reply = "Disculpa, tuve un problema tecnico. Un humano te contactara pronto."

  try {
    let rounds = 0
    let response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    })

    while (response.stop_reason === "tool_use" && rounds < MAX_TOOL_ROUNDS) {
      rounds += 1
      messages.push({ role: "assistant", content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of response.content) {
        if (block.type !== "tool_use") continue
        const { result } = await executeTool(
          business,
          clientPhone,
          block.name,
          block.input as Record<string, unknown>
        )
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        })
      }

      messages.push({ role: "user", content: toolResults })

      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      })
    }

    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    )
    if (textBlocks.length > 0) {
      reply = textBlocks.map((b) => b.text).join("\n").trim()
    }
  } catch (error) {
    console.error("Error en LAIA:", error)
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { status: "ESCALATED" },
    })
  }

  const now = new Date().toISOString()
  const updatedMessages: ChatMessage[] = [
    ...history,
    { role: "user", content: userMessage, timestamp: now },
    { role: "assistant", content: reply, timestamp: now },
  ]

  await prisma.conversation.update({
    where: { id: convo.id },
    data: { messages: updatedMessages as unknown as object },
  })

  return reply
}
