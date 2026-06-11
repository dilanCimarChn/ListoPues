import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentBusiness } from "@/lib/auth"

const updateSchema = z.object({
  saleId: z.string(),
  status: z.enum(["PENDING", "PAID", "DELIVERED", "CANCELLED"]),
})

export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const sales = await prisma.sale.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ data: sales })
  } catch (error) {
    console.error("Error listando ventas:", error)
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

    const sale = await prisma.sale.findFirst({
      where: { id: parsed.data.saleId, businessId: business.id },
    })
    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    const updated = await prisma.sale.update({
      where: { id: sale.id },
      data: { status: parsed.data.status },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error actualizando venta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
