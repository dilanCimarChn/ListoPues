import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentBusiness } from "@/lib/auth"

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(500).nullable().optional(),
  price: z.number().positive().optional(),
  image: z.string().url().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

async function findOwnedProduct(id: string) {
  const business = await getCurrentBusiness()
  if (!business) return { business: null, product: null }

  const product = await prisma.product.findFirst({
    where: { id, businessId: business.id },
  })
  return { business, product }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const { business, product } = await findOwnedProduct(id)

    if (!business) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error("Error obteniendo producto:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const { business, product } = await findOwnedProduct(id)

    if (!business) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 }
      )
    }

    if (parsed.data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, businessId: business.id },
      })
      if (!category) {
        return NextResponse.json({ error: "Categoria invalida" }, { status: 400 })
      }
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: parsed.data,
      include: { category: true },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error actualizando producto:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const { business, product } = await findOwnedProduct(id)

    if (!business) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    await prisma.product.delete({ where: { id: product.id } })
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error("Error eliminando producto:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
