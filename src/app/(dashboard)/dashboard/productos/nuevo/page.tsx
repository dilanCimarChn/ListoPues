import { prisma } from "@/lib/db"
import { requireBusiness } from "@/lib/guards"
import { ProductForm } from "@/components/dashboard/ProductForm"
import type { Product } from "@/types"

interface PageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function NuevoProductoPage({ searchParams }: PageProps) {
  const business = await requireBusiness()
  const { id } = await searchParams

  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
  })

  let product: Product | undefined
  if (id) {
    const found = await prisma.product.findFirst({
      where: { id, businessId: business.id },
    })
    if (found) {
      product = {
        id: found.id,
        name: found.name,
        description: found.description,
        price: found.price,
        image: found.image,
        stock: found.stock,
        available: found.available,
        featured: found.featured,
        businessId: found.businessId,
        categoryId: found.categoryId,
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {product ? "Editar producto" : "Nuevo producto"}
        </h1>
        <p className="text-sm text-text-muted">
          {product
            ? `Editando "${product.name}"`
            : "Completa los datos y tu producto aparecera en la vitrina"}
        </p>
      </div>

      <ProductForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          businessId: c.businessId,
        }))}
        product={product}
      />
    </div>
  )
}
