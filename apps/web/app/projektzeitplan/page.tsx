import { PageHeader } from "@/components/layout/page-header"
import { ProjektzeitplanOptions } from "@/components/planung/projektzeitplan-options"
import { Badge } from "@workspace/ui/components/badge"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

export default function ProjektzeitplanPage() {
  return (
    <TooltipProvider delay={200}>
      <main className="min-h-dvh bg-background p-4 md:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <PageHeader
            title="Projektzeitplan"
            titleHint="Massnahmen fuer Materialengpaesse vergleichen und auswaehlen."
            badge={<Badge variant="secondary">Engpass: Besucherstuehle</Badge>}
          />

          <ProjektzeitplanOptions />
        </div>
      </main>
    </TooltipProvider>
  )
}
