import Link from "next/link"
import { redirect } from "next/navigation"

import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { BaustellenPicker } from "@/components/baustellen-picker"
import { SidebarNav } from "@/components/sidebar-nav"
import { listBaustellen } from "@/lib/data/baustellen"
import { getCurrentBaustelle } from "@/lib/current-baustelle"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const baustelle = await getCurrentBaustelle()
  const alle = await listBaustellen()

  if (!baustelle) {
    redirect("/admin")
  }

  return (
    <TooltipProvider delay={200}>
      <div className="flex min-h-screen">
        <SidebarNav baustelleName={baustelle.name} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b bg-background px-6 py-3 flex items-center justify-between gap-4">
            <BaustellenPicker baustellen={alle} currentId={baustelle.id} />
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin →
            </Link>
          </header>
          <main className="flex-1 p-6 bg-muted/20">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
