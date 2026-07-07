import Link from "next/link"
import { ArrowLeftIcon, ShieldIcon } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldIcon className="h-4 w-4" />
            Admin-Bereich
          </div>
          <Link
            href="/bauleitung"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Zurück zum Tool
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  )
}
