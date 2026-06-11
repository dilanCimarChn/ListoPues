import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Proxy (antes "middleware" en Next.js <16): protege las rutas del dashboard.
 * Hace un chequeo optimista de la cookie de sesion de Auth.js; la validacion
 * completa de sesion ocurre en los Server Components y API routes.
 */
export function proxy(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token")

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
