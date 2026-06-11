import Link from "next/link"
import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { Button } from "@/components/ui/Button"
import { ProductsTable } from "@/components/dashboard/ProductsTable"
import type { Product } from "@/types"

export default async function ProductosPage() {
  const business = await requireBusiness()

  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })

  const serialized: Product[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    stock: p.stock,
    available: p.available,
    featured: p.featured,
    businessId: p.businessId,
    categoryId: p.categoryId,
    category: p.category
      ? { id: p.category.id, name: p.category.name, businessId: p.category.businessId }
      : null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-text-muted">
            {products.length} producto{products.length === 1 ? "" : "s"} en tu catalogo
          </p>
        </div>
        <Link href="/dashboard/productos/nuevo">
          <Button>Nuevo producto</Button>
        </Link>
      </div>

      <ProductsTable products={serialized} currency={business.currency} />
    </div>
  )
}
