import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { AppointmentsCalendar } from "@/components/dashboard/AppointmentsCalendar"
import type { Appointment } from "@/types"

export default async function CitasPage() {
  const business = await requireBusiness(true)

  const appointments = await prisma.appointment.findMany({
    where: { businessId: business.id },
    orderBy: { date: "asc" },
  })

  const serialized: Appointment[] = appointments.map((a) => ({
    id: a.id,
    clientName: a.clientName,
    clientPhone: a.clientPhone,
    date: a.date.toISOString(),
    service: a.service,
    status: a.status,
    notes: a.notes,
    businessId: a.businessId,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Citas</h1>
        <p className="text-sm text-text-muted">
          Las citas que LAIA agenda con tus clientes aparecen aqui
        </p>
      </div>

      <AppointmentsCalendar appointments={serialized} />
    </div>
  )
}
