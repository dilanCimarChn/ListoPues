import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentBusiness } from "@/lib/auth"
import { PLAN_LIMITS } from "@/lib/utils"

const createSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().max(500).nullable().optional(),
  price: z.number().positive("El precio debe ser mayor a 0"),
  image: z.string().url().nullable().optional(),
  stock: z.number().int().min(0).default(0),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  categoryId: z.string().nullable().optional(),
})

export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: { businessId: business.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: products })
  } catch (error) {
    console.error("Error listando productos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 }
      )
    }

    const count = await prisma.product.count({ where: { businessId: business.id } })
    const limit = PLAN_LIMITS[business.plan].products
    if (count >= limit) {
      return NextResponse.json(
        { error: `Llegaste al limite de ${limit} productos de tu plan` },
        { status: 403 }
      )
    }

    // Verifica que la categoria pertenezca al negocio
    if (parsed.data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, businessId: business.id },
      })
      if (!category) {
        return NextResponse.json({ error: "Categoria invalida" }, { status: 400 })
      }
    }

    const product = await prisma.product.create({
      data: { ...parsed.data, businessId: business.id },
      include: { category: true },
    })

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error("Error creando producto:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
