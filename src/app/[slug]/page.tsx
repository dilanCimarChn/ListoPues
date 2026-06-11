import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Storefront } from "@/components/storefront/Storefront"
import type { Business, Category, Product } from "@/types"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getStorefrontData(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      },
      categories: { orderBy: { name: "asc" } },
    },
  })

  if (!business || !business.active) return null
  return business
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const business = await getStorefrontData(slug)

  if (!business) {
    return { title: "Tienda no encontrada" }
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://listopues.com"}/${business.slug}`

  return {
    title: `${business.name} — Tienda Online`,
    description:
      business.description ??
      `Compra en ${business.name} y pide por WhatsApp con Listo Pues.`,
    openGraph: {
      title: business.name,
      description:
        business.description ??
        `Compra en ${business.name} y pide por WhatsApp.`,
      images: business.logo ? [business.logo] : [],
      url,
    },
    robots: { index: true, follow: true },
  }
}

export default async function StorefrontPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getStorefrontData(slug)
  if (!data) notFound()

  const business: Business = {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    logo: data.logo,
    whatsapp: data.whatsapp,
    primaryColor: data.primaryColor,
    currency: data.currency,
    active: data.active,
    plan: data.plan,
    domain: data.domain,
  }

  const products: Product[] = data.products.map((p) => ({
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
  }))

  const categories: Category[] = data.categories.map((c) => ({
    id: c.id,
    name: c.name,
    businessId: c.businessId,
  }))

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://listopues.com"
  const storeUrl = `${baseUrl}/${business.slug}`
  const availableProducts = products.filter((p) => p.available)

  // Schema.org: LocalBusiness + ItemList de productos
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: business.name,
      description: business.description ?? undefined,
      telephone: `+${business.whatsapp}`,
      url: storeUrl,
      image: business.logo ?? undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: availableProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          description: product.description ?? undefined,
          image: product.image ?? undefined,
          url: storeUrl,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: business.currency,
            availability:
              product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        },
      })),
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Storefront business={business} products={products} categories={categories} />
    </>
  )
}
