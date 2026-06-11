import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentBusiness } from "@/lib/auth"
import { PLAN_LIMITS, remainingSlots } from "@/lib/utils"

const updateStockSchema = z.object({
  productId: z.string(),
  stock: z.number().int().min(0),
})

export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, stock: true, available: true, price: true },
      orderBy: { stock: "asc" },
    })

    const summary = {
      totalProducts: products.length,
      outOfStock: products.filter((p) => p.stock === 0 || !p.available).length,
      lowStock: products.filter((p) => p.available && p.stock > 0 && p.stock <= 5).length,
      limit: PLAN_LIMITS[business.plan].products,
      remaining: remainingSlots(business.plan, products.length),
    }

    return NextResponse.json({ data: { products, summary } })
  } catch (error) {
    console.error("Error obteniendo inventario:", error)
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
    const parsed = updateStockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 }
      )
    }

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, businessId: business.id },
    })
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        stock: parsed.data.stock,
        available: parsed.data.stock > 0,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error actualizando stock:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
