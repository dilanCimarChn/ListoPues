import { createHmac, timingSafeEqual } from "crypto"

/**
 * Integracion con Wallbit para cobros online.
 * Crea sesiones de pago y valida los webhooks de confirmacion.
 */

const WALLBIT_BASE_URL = "https://api.wallbit.io/v1"

export interface WallbitSession {
  id: string
  paymentUrl: string
}

export interface CreateSessionInput {
  amount: number
  currency: string
  description: string
  reference: string // id de la venta en nuestra DB
  successUrl: string
  cancelUrl: string
}

export async function createPaymentSession(
  input: CreateSessionInput
): Promise<WallbitSession> {
  const apiKey = process.env.WALLBIT_API_KEY
  if (!apiKey) {
    throw new Error("WALLBIT_API_KEY no configurada")
  }

  const res = await fetch(`${WALLBIT_BASE_URL}/checkout/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      external_reference: input.reference,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Wallbit error ${res.status}: ${detail}`)
  }

  const data = (await res.json()) as { id: string; payment_url: string }
  return { id: data.id, paymentUrl: data.payment_url }
}

/**
 * Valida la firma HMAC-SHA256 del webhook de Wallbit.
 * Wallbit firma el cuerpo crudo y envia la firma en `x-wallbit-signature`.
 */
export function verifyWallbitSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.WALLBIT_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")

  const expectedBuffer = Buffer.from(expected, "hex")
  const receivedBuffer = Buffer.from(signature, "hex")

  if (expectedBuffer.length !== receivedBuffer.length) return false
  return timingSafeEqual(expectedBuffer, receivedBuffer)
}

export interface WallbitWebhookEvent {
  type: string
  sessionId: string
  reference: string
  receiptUrl: string | null
}

export function parseWallbitWebhook(body: unknown): WallbitWebhookEvent | null {
  try {
    const payload = body as {
      type?: string
      data?: {
        id?: string
        external_reference?: string
        receipt_url?: string
      }
    }
    if (!payload.type || !payload.data?.id) return null

    return {
      type: payload.type,
      sessionId: payload.data.id,
      reference: payload.data.external_reference ?? "",
      receiptUrl: payload.data.receipt_url ?? null,
    }
  } catch {
    return null
  }
}
