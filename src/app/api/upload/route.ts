import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getCurrentBusiness } from "@/lib/auth"

const MAX_SIZE = 4 * 1024 * 1024 // 4 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: Request) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibio ningun archivo" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no soportado. Usa JPG, PNG, WebP o GIF" },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 4 MB" },
        { status: 400 }
      )
    }

    const extension = file.name.split(".").pop() ?? "jpg"
    const blob = await put(
      `${business.slug}/${Date.now()}.${extension}`,
      file,
      { access: "public" }
    )

    return NextResponse.json({ data: { url: blob.url } }, { status: 201 })
  } catch (error) {
    console.error("Error subiendo imagen:", error)
    return NextResponse.json({ error: "Error subiendo la imagen" }, { status: 500 })
  }
}
