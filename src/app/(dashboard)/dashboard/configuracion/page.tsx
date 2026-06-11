import { requireBusiness } from "@/lib/guards"
import { ConfigForm } from "@/components/dashboard/ConfigForm"

export default async function ConfiguracionPage() {
  const business = await requireBusiness()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuracion</h1>
        <p className="text-sm text-text-muted">
          Personaliza tu vitrina: logo, colores, WhatsApp y moneda
        </p>
      </div>

      <ConfigForm
        business={{
          id: business.id,
          slug: business.slug,
          name: business.name,
          description: business.description,
          logo: business.logo,
          whatsapp: business.whatsapp,
          primaryColor: business.primaryColor,
          currency: business.currency,
          active: business.active,
          plan: business.plan,
          domain: business.domain,
        }}
      />
    </div>
  )
}
