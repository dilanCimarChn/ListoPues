import { requireBusiness } from "@/lib/guards"
import { LaiaEditor } from "@/components/dashboard/LaiaEditor"
import type { FAQ } from "@/types"

export default async function LaiaPage() {
  const business = await requireBusiness(true)

  const context = business.aiContext
    ? {
        id: business.aiContext.id,
        businessId: business.aiContext.businessId,
        systemPrompt: business.aiContext.systemPrompt,
        tone: business.aiContext.tone,
        faqs: (business.aiContext.faqs as unknown as FAQ[]) ?? [],
      }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LAIA</h1>
        <p className="text-sm text-text-muted">
          Configura la personalidad, el tono y las respuestas de tu asistente IA
        </p>
      </div>

      <LaiaEditor context={context} businessName={business.name} />
    </div>
  )
}
