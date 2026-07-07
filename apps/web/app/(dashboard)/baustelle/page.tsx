import { OfflineHinweis } from "@/components/baustelle/offline-hinweis"
import {
  ConflictSeverityBadge,
  ConflictStatusBadge,
  MaterialStatusBadge,
} from "@/components/dashboard/status-badges"
import { formatQuantity } from "@/components/dashboard/formatters"
import {
  KonfliktKommentarDialog,
  KonfliktStatusControl,
  MeldeKonfliktDialog,
} from "@/components/forms/muss-flow-forms"
import { projectRepository, WBK_DEMO_PROJECT_ID } from "@/lib/project"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default async function BaustellePage() {
  const { data } = await projectRepository.getBauUebersicht(WBK_DEMO_PROJECT_ID)

  const offeneKonflikte = data.konflikte.filter(
    (konflikt) => konflikt.status !== "geloest" && konflikt.status !== "uebernommen"
  )
  const kritischeMaterialien = data.materialien.filter(
    (item) =>
      item.material.status === "kritisch" || item.material.verbleibend <= 0
  )

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Baustelle</h1>
        <p className="text-sm text-muted-foreground">
          Schnellmeldungen von {data.standort.name}. Für Handy-Nutzung optimiert.
        </p>
      </div>

      <OfflineHinweis />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schnellmeldung</CardTitle>
          <CardDescription>
            Konflikt, fehlendes Material oder Rückfrage direkt an die Planung
            melden.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <MeldeKonfliktDialog quelle="bau" triggerLabel="Neue Meldung erfassen" />
          <p className="text-xs text-muted-foreground">
            Foto-Anhang folgt – aktuell als Platzhalter im Kommentar möglich.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offene Meldungen</CardTitle>
          <CardDescription>Status mit einem Tipp aktualisieren.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {offeneKonflikte.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine offenen Meldungen.
            </p>
          ) : (
            offeneKonflikte.map((konflikt) => (
              <div
                key={konflikt.id}
                className="flex flex-col gap-2 rounded-2xl border p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{konflikt.titel}</p>
                  <ConflictStatusBadge status={konflikt.status} />
                  <ConflictSeverityBadge severity={konflikt.prioritaet} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <KonfliktStatusControl
                    konfliktId={konflikt.id}
                    status={konflikt.status}
                  />
                  <KonfliktKommentarDialog konfliktId={konflikt.id} rolle="bau" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kritisches Material</CardTitle>
          <CardDescription>Bestand niedrig oder aufgebraucht.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {kritischeMaterialien.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Kein kritisches Material.
            </p>
          ) : (
            kritischeMaterialien.map(({ material }) => (
              <div
                key={material.id}
                className="flex items-center justify-between gap-2 rounded-2xl border p-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{material.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Verbleibend{" "}
                    {formatQuantity(material.verbleibend, material.einheit)}
                  </span>
                </div>
                <MaterialStatusBadge status={material.status} />
              </div>
            ))
          )}
          <Badge variant="outline" className="w-fit">
            Meldung erzeugt Aktivität und Audit-Eintrag
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
