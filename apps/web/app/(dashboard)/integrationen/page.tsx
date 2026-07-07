import { ActiveProjectBoundary } from "@/components/active-project-boundary"
import { ErpImportPanel } from "@/components/dashboard/erp-import-panel"
import { PageHeader } from "@/components/layout/page-header"
import { SectionCard } from "@/components/layout/section-card"
import { Badge } from "@workspace/ui/components/badge"

export default function IntegrationenPage() {
  return (
    <ActiveProjectBoundary>
      {(projectId) => <IntegrationenContent projectId={projectId} />}
    </ActiveProjectBoundary>
  )
}

function IntegrationenContent({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Integrationen"
        badge={<Badge variant="secondary">ERP / EAP</Badge>}
      />
      <p className="-mt-4 text-sm text-muted-foreground">
        Anbindung externer Systeme für Material, Kosten und Betreiberdaten.
      </p>

      <SectionCard
        title="ERP/EAP-Materialimport"
        titleHint="CSV- oder JSON-Import im Demo-Modus. Produktiv über Supabase-Adapter und Service-Role."
      >
        <ErpImportPanel projectId={projectId} />
      </SectionCard>

      <SectionCard
        title="Geplante Schnittstellen"
        titleHint="Weitere Integrationen aus dem Plattform-Epic."
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Supabase Realtime für domänenübergreifende Aktualisierungen</li>
          <li>Vision-API (OpenAI / Vercel AI Gateway) für Baustellenkamera</li>
          <li>Storage-Buckets für Planunterlagen und Baustellenfotos</li>
        </ul>
      </SectionCard>
    </div>
  )
}
