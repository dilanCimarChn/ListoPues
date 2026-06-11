/**
 * Cliente minimo para Evolution API (WhatsApp).
 * Lite usa la instancia del bot del dueno; Pro usa la instancia de LAIA.
 */

type EvolutionInstance = "lite" | "pro"

function instanceName(instance: EvolutionInstance): string {
  return instance === "lite"
    ? process.env.EVOLUTION_INSTANCE_LITE ?? "listopues-lite"
    : process.env.EVOLUTION_INSTANCE_PRO ?? "listopues-pro"
}

export async function sendWhatsAppText(
  instance: EvolutionInstance,
  phone: string,
  text: string
): Promise<boolean> {
  const baseUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY

  if (!baseUrl || !apiKey) {
    console.error("Evolution API no configurada (EVOLUTION_API_URL / EVOLUTION_API_KEY)")
    return false
  }

  const number = phone.replace(/\D/g, "")

  try {
    const res = await fetch(
      `${baseUrl}/message/sendText/${instanceName(instance)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({ number, text }),
      }
    )

    if (!res.ok) {
      console.error("Evolution API error:", res.status, await res.text())
      return false
    }
    return true
  } catch (error) {
    console.error("Evolution API fetch error:", error)
    return false
  }
}

/**
 * Valida que el webhook venga de nuestra instancia de Evolution API.
 * Evolution envia el header `apikey` configurado en la instancia.
 */
export function isValidEvolutionRequest(request: Request): boolean {
  const apiKey = process.env.EVOLUTION_API_KEY
  if (!apiKey) return false
  const header = request.headers.get("apikey")
  return header === apiKey
}

export interface EvolutionWebhookMessage {
  remoteJid: string
  fromMe: boolean
  text: string
  pushName: string
}

/**
 * Normaliza el payload de Evolution API (evento messages.upsert)
 * a un mensaje simple { telefono, texto, nombre }.
 */
export function parseEvolutionWebhook(body: unknown): EvolutionWebhookMessage | null {
  try {
    const payload = body as {
      data?: {
        key?: { remoteJid?: string; fromMe?: boolean }
        pushName?: string
        message?: {
          conversation?: string
          extendedTextMessage?: { text?: string }
        }
      }
    }

    const data = payload.data
    if (!data?.key?.remoteJid) return null

    const text =
      data.message?.conversation ??
      data.message?.extendedTextMessage?.text ??
      ""

    if (!text.trim()) return null

    return {
      remoteJid: data.key.remoteJid,
      fromMe: data.key.fromMe ?? false,
      text: text.trim(),
      pushName: data.pushName ?? "Cliente",
    }
  } catch {
    return null
  }
}

/** Extrae el numero de telefono de un remoteJid tipo 59171234567@s.whatsapp.net */
export function phoneFromJid(remoteJid: string): string {
  return remoteJid.split("@")[0]
}
