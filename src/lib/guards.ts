import { redirect } from "next/navigation"
import { getCurrentBusiness } from "@/lib/auth"

/**
 * Garantiza sesion activa y negocio existente en paginas del dashboard.
 * Si `requirePro` es true y el negocio es Lite, redirige a /dashboard/mi-plan.
 */
export async function requireBusiness(requirePro = false) {
  const business = await getCurrentBusiness()
  if (!business) redirect("/login")
  if (requirePro && business.plan !== "PRO") redirect("/dashboard/mi-plan")
  return business
}
