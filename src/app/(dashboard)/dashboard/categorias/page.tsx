import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { CategoriesManager } from "@/components/dashboard/CategoriesManager"

export default async function CategoriasPage() {
  const business = await requireBusiness()

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="text-sm text-text-muted">
          Organiza tu catalogo para que tus clientes encuentren rapido lo que buscan
        </p>
      </div>

      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          _count: c._count,
        }))}
      />
    </div>
  )
}
