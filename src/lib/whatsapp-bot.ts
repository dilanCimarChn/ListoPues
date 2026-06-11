import type { Business, Product } from "@prisma/client"
import { prisma } from "@/lib/db"
import { formatPrice, PLAN_LIMITS, remainingSlots } from "@/lib/utils"

/**
 * Bot del dueno (plan Lite): el dueno administra su catalogo
 * enviando comandos por WhatsApp via Evolution API.
 *
 * Comandos soportados:
 *  - Agregar: [nombre] | Precio: [n] | Stock: [n] | [url foto opcional]
 *  - Modificar [ID]: precio [n]
 *  - Stock [ID]: [n]
 *  - Eliminar [ID]
 *  - Agotar [ID]
 *  - Inventario
 *  - Cupos
 */

const HELP_TEXT = [
  "No entendi ese comando. Estos son los comandos disponibles:",
  "",
  "- Agregar: Nombre | Precio: 100 | Stock: 10",
  "- Modificar [ID]: precio 120",
  "- Stock [ID]: 25",
  "- Eliminar [ID]",
  "- Agotar [ID]",
  "- Inventario",
  "- Cupos",
  "",
  "El [ID] es el codigo corto que aparece en el comando Inventario.",
].join("\n")

/** Codigo corto legible para usar por WhatsApp (ultimos 6 chars del cuid). */
export function shortCode(id: string): string {
  return id.slice(-6).toUpperCase()
}

async function findByShortCode(
  businessId: string,
  code: string
): Promise<Product | null> {
  const products = await prisma.product.findMany({ where: { businessId } })
  const normalized = code.trim().toLowerCase()
  return (
    products.find((p) => p.id.toLowerCase().endsWith(normalized)) ?? null
  )
}

async function handleAgregar(business: Business, text: string): Promise<string> {
  // Acepta tanto "│" como "|" de separador
  const body = text.replace(/^agregar\s*:/i, "")
  const parts = body.split(/[│|]/).map((p) => p.trim()).filter(Boolean)

  if (parts.length < 2) {
    return "Formato invalido. Ejemplo:\nAgregar: Torta de chocolate | Precio: 150 | Stock: 5"
  }

  const name = parts[0]
  let price: number | null = null
  let stock = 0
  let image: string | null = null

  for (const part of parts.slice(1)) {
    const priceMatch = part.match(/precio\s*:?\s*([\d.,]+)/i)
    const stockMatch = part.match(/stock\s*:?\s*(\d+)/i)
    const urlMatch = part.match(/https?:\/\/\S+/i)

    if (priceMatch) price = parseFloat(priceMatch[1].replace(",", "."))
    else if (stockMatch) stock = parseInt(stockMatch[1], 10)
    else if (urlMatch) image = urlMatch[0]
  }

  if (!name || price === null || isNaN(price) || price <= 0) {
    return "Falta el precio o no es valido. Ejemplo:\nAgregar: Torta de chocolate | Precio: 150 | Stock: 5"
  }

  const count = await prisma.product.count({ where: { businessId: business.id } })
  const limit = PLAN_LIMITS[business.plan].products
  if (count >= limit) {
    return `Llegaste al limite de ${limit} productos de tu plan ${PLAN_LIMITS[business.plan].label}. Escribe "Cupos" para ver tu uso o mejora tu plan en el dashboard.`
  }

  const product = await prisma.product.create({
    data: {
      name,
      price,
      stock,
      image,
      businessId: business.id,
    },
  })

  return [
    `Listo! Producto creado:`,
    `[${shortCode(product.id)}] ${product.name}`,
    `Precio: ${formatPrice(product.price, business.currency)}`,
    `Stock: ${product.stock}`,
  ].join("\n")
}

async function handleModificar(business: Business, text: string): Promise<string> {
  const match = text.match(/^modificar\s+(\S+)\s*:\s*precio\s+([\d.,]+)/i)
  if (!match) {
    return "Formato invalido. Ejemplo:\nModificar A1B2C3: precio 120"
  }

  const product = await findByShortCode(business.id, match[1])
  if (!product) return `No encontre ningun producto con ID ${match[1].toUpperCase()}.`

  const price = parseFloat(match[2].replace(",", "."))
  if (isNaN(price) || price <= 0) return "El precio no es valido."

  await prisma.product.update({ where: { id: product.id }, data: { price } })
  return `Listo! ${product.name} ahora cuesta ${formatPrice(price, business.currency)}.`
}

async function handleStock(business: Business, text: string): Promise<string> {
  const match = text.match(/^stock\s+(\S+)\s*:\s*(\d+)/i)
  if (!match) {
    return "Formato invalido. Ejemplo:\nStock A1B2C3: 25"
  }

  const product = await findByShortCode(business.id, match[1])
  if (!product) return `No encontre ningun producto con ID ${match[1].toUpperCase()}.`

  const stock = parseInt(match[2], 10)
  await prisma.product.update({
    where: { id: product.id },
    data: { stock, available: stock > 0 },
  })
  return `Listo! ${product.name} ahora tiene ${stock} unidades en stock.`
}

async function handleEliminar(business: Business, text: string): Promise<string> {
  const match = text.match(/^eliminar\s+(\S+)/i)
  if (!match) return "Formato invalido. Ejemplo:\nEliminar A1B2C3"

  const product = await findByShortCode(business.id, match[1])
  if (!product) return `No encontre ningun producto con ID ${match[1].toUpperCase()}.`

  await prisma.product.delete({ where: { id: product.id } })
  return `Listo! Elimine "${product.name}" de tu catalogo.`
}

async function handleAgotar(business: Business, text: string): Promise<string> {
  const match = text.match(/^agotar\s+(\S+)/i)
  if (!match) return "Formato invalido. Ejemplo:\nAgotar A1B2C3"

  const product = await findByShortCode(business.id, match[1])
  if (!product) return `No encontre ningun producto con ID ${match[1].toUpperCase()}.`

  await prisma.product.update({
    where: { id: product.id },
    data: { available: false, stock: 0 },
  })
  return `Listo! "${product.name}" quedo marcado como agotado en tu vitrina.`
}

async function handleInventario(business: Business): Promise<string> {
  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  })

  if (products.length === 0) {
    return 'Tu catalogo esta vacio. Agrega tu primer producto con:\nAgregar: Nombre | Precio: 100 | Stock: 10'
  }

  const lines = products.map((p) => {
    const state = !p.available || p.stock === 0 ? " (AGOTADO)" : ""
    return `[${shortCode(p.id)}] ${p.name} — ${formatPrice(p.price, business.currency)} — Stock: ${p.stock}${state}`
  })

  return [`Tu inventario (${products.length} productos):`, "", ...lines].join("\n")
}

async function handleCupos(business: Business): Promise<string> {
  const count = await prisma.product.count({ where: { businessId: business.id } })
  const limit = PLAN_LIMITS[business.plan].products
  const remaining = remainingSlots(business.plan, count)

  return [
    `Plan ${PLAN_LIMITS[business.plan].label}:`,
    `Productos usados: ${count} de ${limit}`,
    `Cupos disponibles: ${remaining}`,
  ].join("\n")
}

/**
 * Procesa un comando del dueno y devuelve la respuesta a enviar por WhatsApp.
 */
export async function handleOwnerCommand(
  business: Business,
  text: string
): Promise<string> {
  const normalized = text.trim().toLowerCase()

  try {
    if (normalized.startsWith("agregar")) return await handleAgregar(business, text.trim())
    if (normalized.startsWith("modificar")) return await handleModificar(business, text.trim())
    if (normalized.startsWith("stock")) return await handleStock(business, text.trim())
    if (normalized.startsWith("eliminar")) return await handleEliminar(business, text.trim())
    if (normalized.startsWith("agotar")) return await handleAgotar(business, text.trim())
    if (normalized === "inventario") return await handleInventario(business)
    if (normalized === "cupos") return await handleCupos(business)
    return HELP_TEXT
  } catch (error) {
    console.error("Error procesando comando del dueno:", error)
    return "Ocurrio un error procesando tu comando. Intenta de nuevo en unos minutos."
  }
}
