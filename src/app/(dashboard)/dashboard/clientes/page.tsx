import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { formatDate, formatPrice } from "@/lib/utils"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

interface ClientRow {
  phone: string
  name: string
  totalSpent: number
  purchases: number
  appointments: number
  lastActivity: Date
}

export default async function ClientesPage() {
  const business = await requireBusiness(true)

  const [sales, appointments, conversations] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId: business.id },
      select: {
        clientPhone: true,
        clientName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.appointment.findMany({
      where: { businessId: business.id },
      select: { clientPhone: true, clientName: true, createdAt: true },
    }),
    prisma.conversation.findMany({
      where: { businessId: business.id },
      select: { clientPhone: true, updatedAt: true },
    }),
  ])

  // Unifica clientes por telefono a partir de ventas, citas y conversaciones
  const clients = new Map<string, ClientRow>()

  function ensure(phone: string, name: string, date: Date): ClientRow {
    const existing = clients.get(phone)
    if (existing) {
      if (date > existing.lastActivity) existing.lastActivity = date
      if (name && existing.name === "Cliente") existing.name = name
      return existing
    }
    const row: ClientRow = {
      phone,
      name: name || "Cliente",
      totalSpent: 0,
      purchases: 0,
      appointments: 0,
      lastActivity: date,
    }
    clients.set(phone, row)
    return row
  }

  for (const sale of sales) {
    const row = ensure(sale.clientPhone, sale.clientName, sale.createdAt)
    if (sale.status === "PAID" || sale.status === "DELIVERED") {
      row.totalSpent += sale.total
      row.purchases += 1
    }
  }
  for (const appointment of appointments) {
    const row = ensure(appointment.clientPhone, appointment.clientName, appointment.createdAt)
    row.appointments += 1
  }
  for (const conversation of conversations) {
    ensure(conversation.clientPhone, "Cliente", conversation.updatedAt)
  }

  const rows = [...clients.values()].sort((a, b) => b.totalSpent - a.totalSpent)
  const totalRevenue = rows.reduce((sum, c) => sum + c.totalSpent, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-text-muted">
          Tu base de clientes construida automaticamente desde ventas, citas y chats
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Clientes" value={rows.length} delay={0} />
        <StatsCard
          title="Compradores"
          value={rows.filter((c) => c.purchases > 0).length}
          delay={75}
        />
        <StatsCard
          title="Ingresos totales"
          value={formatPrice(totalRevenue, business.currency)}
          delay={150}
        />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-12 text-center text-sm text-text-muted">
          Aun no tienes clientes registrados. Apareceran cuando alguien compre,
          agende una cita o chatee con LAIA.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((client) => (
            <Card key={client.phone}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-text-muted">{client.phone}</p>
                  </div>
                  {client.totalSpent > 0 && (
                    <Badge variant="success">
                      {formatPrice(client.totalSpent, business.currency)}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-text-muted">
                  <span>{client.purchases} compras</span>
                  <span>{client.appointments} citas</span>
                  <span>Ultima actividad: {formatDate(client.lastActivity)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
