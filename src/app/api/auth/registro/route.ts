import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { slugify } from "@/lib/utils"

const registerSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
  businessName: z.string().min(2, "El nombre del negocio es muy corto"),
  whatsapp: z.string().min(8, "Numero de WhatsApp invalido"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 }
      )
    }

    const { name, email, password, businessName, whatsapp } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      )
    }

    // Genera un slug unico para la vitrina
    const baseSlug = slugify(businessName) || "mi-negocio"
    let slug = baseSlug
    let attempt = 1
    while (await prisma.business.findUnique({ where: { slug } })) {
      attempt += 1
      slug = `${baseSlug}-${attempt}`
    }

    const hashed = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        businesses: {
          create: {
            name: businessName,
            slug,
            whatsapp: whatsapp.replace(/\D/g, ""),
          },
        },
      },
      include: { businesses: true },
    })

    return NextResponse.json(
      { data: { id: user.id, slug: user.businesses[0]?.slug } },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error interno creando la cuenta" },
      { status: 500 }
    )
  }
}
