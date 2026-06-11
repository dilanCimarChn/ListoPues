import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCurrentBusiness } from "@/lib/auth"

const createSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto").max(50),
})

export async function GET() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: { businessId: business.id },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error("Error listando categorias:", error)
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

    const category = await prisma.category.create({
      data: { name: parsed.data.name, businessId: business.id },
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error("Error creando categoria:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Falta el id de la categoria" }, { status: 400 })
    }

    const category = await prisma.category.findFirst({
      where: { id, businessId: business.id },
    })
    if (!category) {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 })
    }

    // Desasocia los productos antes de eliminar
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    })
    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error("Error eliminando categoria:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
