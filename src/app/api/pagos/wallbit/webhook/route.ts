import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parseWallbitWebhook, verifyWallbitSignature } from "@/lib/wallbit"
import { sendWhatsAppText } from "@/lib/evolution"
import { formatPrice } from "@/lib/utils"
import type { SaleItem } from "@/types"

/**
 * Webhook de Wallbit: confirma pagos exitosos.
 * Valida la firma HMAC, marca la venta como PAID, descuenta stock
 * y notifica al dueno por WhatsApp.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-wallbit-signature")

    if (!verifyWallbitSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Firma invalida" }, { status: 401 })
    }

    const event = parseWallbitWebhook(JSON.parse(rawBody))
    if (!event) {
      return NextResponse.json({ error: "Payload invalido" }, { status: 400 })
    }

    if (event.type !== "checkout.session.paid") {
      return NextResponse.json({ data: { ignored: true } })
    }

    const sale = await prisma.sale.findUnique({
      where: { id: event.reference },
      include: { business: true },
    })
    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }
    if (sale.status === "PAID") {
      // Webhook reenviado: idempotente
      return NextResponse.json({ data: { ok: true } })
    }

    const items = (sale.items as unknown as SaleItem[]) ?? []

    // Marca como pagada y descuenta stock en una sola transaccion
    await prisma.$transaction([
      prisma.sale.update({
        where: { id: sale.id },
        data: { status: "PAID", receiptUrl: event.receiptUrl },
      }),
      ...items.map((item) =>
        prisma.product.updateMany({
          where: { id: item.productId, businessId: sale.businessId },
          data: { stock: { decrement: item.quantity } },
        })
      ),
    ])

    // Marca como agotados los productos que quedaron sin stock
    await prisma.product.updateMany({
      where: { businessId: sale.businessId, stock: { lte: 0 } },
      data: { available: false, stock: 0 },
    })

    const instance = sale.business.plan === "PRO" ? "pro" : "lite"
    await sendWhatsAppText(
      instance,
      sale.business.whatsapp,
      [
        `Pago confirmado en ${sale.business.name}:`,
        `Cliente: ${sale.clientName} (${sale.clientPhone})`,
        `Total: ${formatPrice(sale.total, sale.business.currency)}`,
        ...items.map((i) => `- ${i.quantity}x ${i.name}`),
        event.receiptUrl ? `Comprobante: ${event.receiptUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    )

    return NextResponse.json({ data: { ok: true } })
  } catch (error) {
    console.error("Error en webhook de Wallbit:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
