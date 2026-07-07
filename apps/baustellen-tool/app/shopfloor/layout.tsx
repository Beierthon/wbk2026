import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeftIcon, HammerIcon } from "lucide-react"

import { getCurrentBaustelle } from "@/lib/current-baustelle"
import { getCurrentShopfloorPerson } from "@/lib/current-shopfloor-person"

export default async function ShopfloorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const baustelle = await getCurrentBaustelle()
  const person = await getCurrentShopfloorPerson()

  if (!baustelle) redirect("/admin")

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <Link
            href="/bauleitung"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Zurück
          </Link>
          <div className="flex items-center gap-2 text-sm font-medium">
            <HammerIcon className="h-4 w-4" />
            Shopfloor
          </div>
          <div className="text-xs text-muted-foreground">
            {person?.name ?? "—"}
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-2 text-xs text-muted-foreground truncate">
          {baustelle.name}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>
    </div>
  )
}
