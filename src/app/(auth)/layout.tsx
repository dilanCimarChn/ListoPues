import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-bold">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-sm font-black text-slate-950">
          LP
        </span>
        Listo Pues
      </Link>
      {children}
    </div>
  )
}
