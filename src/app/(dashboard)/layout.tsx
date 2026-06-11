import { requireBusiness } from "@/lib/guards"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { Header } from "@/components/dashboard/Header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const business = await requireBusiness()

  return (
    <div className="flex min-h-screen">
      <Sidebar plan={business.plan} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          businessName={business.name}
          slug={business.slug}
          plan={business.plan}
        />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
