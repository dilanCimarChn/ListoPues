import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { createPaymentSession } from "@/lib/wallbit"
import type { SaleItem } from "@/types"

/**
 * Crea una sesion de pago Wallbit desde el checkout de la vitrina publica.
 * Registra la venta como PENDING; el webhook la confirma como PAID.
 */

const checkoutSchema = z.object({
  businessSlug: z.string(),
  clientName: z.string().min(2, "Indica tu nombre"),
  clientPhone: z.string().min(8, "Numero de telefono invalido"),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "El carrito esta vacio"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { slug: parsed.data.businessSlug },
    })
    if (!business || !business.active) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    // El precio siempre se toma de la DB, nunca del cliente
    const products = await prisma.product.findMany({
      where: {
        id: { in: parsed.data.items.map((i) => i.productId) },
        businessId: business.id,
        available: true,
      },
    })

    const saleItems: SaleItem[] = []
    let total = 0

    for (const item of parsed.data.items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        return NextResponse.json(
          { error: "Uno de los productos ya no esta disponible" },
          { status: 409 }
        )
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente de "${product.name}"` },
          { status: 409 }
        )
      }
      saleItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      })
      total += product.price * item.quantity
    }

    const sale = await prisma.sale.create({
      data: {
        clientName: parsed.data.clientName,
        clientPhone: parsed.data.clientPhone.replace(/\D/g, ""),
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

    return NextResponse.json(
      { data: { saleId: sale.id, paymentUrl: session.paymentUrl } },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creando pago Wallbit:", error)
    return NextResponse.json({ error: "Error creando el pago" }, { status: 500 })
  }
}
