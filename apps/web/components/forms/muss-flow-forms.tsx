import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

import {
  createEntscheidungAction,
  createKommentarAction,
  meldeKonfliktAction,
  publishPlanversionAction,
  uebergebeAssetAction,
} from "@/lib/actions/project-actions"

import { ActionDialog } from "./action-dialog"
import { KonfliktStatusControl } from "./konflikt-status-control"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

interface PlanstandOption {
  id: string
  titel: string
  aktuelleVersion: string
}

export function PublishPlanversionDialog({
  planstaende,
}: {
  planstaende: PlanstandOption[]
}) {
  return (
    <ActionDialog
      triggerLabel="Neue Version veröffentlichen"
      title="Planversion veröffentlichen"
      description="Ersetzt die aktuelle Version und erzeugt einen Aktivitäts- sowie Audit-Eintrag."
      submitLabel="Veröffentlichen"
      successMessage="Neue Planversion veröffentlicht."
      action={publishPlanversionAction}
    >
      <Field label="Planstand">
        <NativeSelect name="planstandId" required>
          {planstaende.map((planstand) => (
            <NativeSelectOption key={planstand.id} value={planstand.id}>
              {planstand.titel} (aktuell {planstand.aktuelleVersion})
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Neue Versionsbezeichnung">
        <Input name="version" placeholder="z. B. TWP-GRU-1.2" required />
      </Field>
      <Field label="Veröffentlicht von">
        <Input name="veroeffentlichtVon" placeholder="Fachplanung" />
      </Field>
      <Field label="Änderungsnotiz">
        <Textarea
          name="aenderungsnotiz"
          placeholder="Was wurde angepasst?"
          required
        />
      </Field>
    </ActionDialog>
  )
}

interface PlanversionOption {
  id: string
  label: string
}

export function MeldeKonfliktDialog({
  planversionen = [],
  quelle = "bau",
  triggerLabel = "Konflikt melden",
}: {
  planversionen?: PlanversionOption[]
  quelle?: "bau" | "planung" | "betrieb"
  triggerLabel?: string
}) {
  return (
    <ActionDialog
      triggerLabel={triggerLabel}
      triggerVariant="outline"
      title="Konflikt aus der Realität melden"
      description="Meldet eine Abweichung an die Zieldomäne. Landet im Aktivitätslog und Audit Trail."
      submitLabel="Konflikt melden"
      successMessage="Konflikt gemeldet."
      action={meldeKonfliktAction}
    >
      <input type="hidden" name="quelle" value={quelle} />
      <Field label="Titel">
        <Input name="titel" placeholder="Kurzbeschreibung" required />
      </Field>
      <Field label="Beschreibung">
        <Textarea
          name="beschreibung"
          placeholder="Was weicht von der Planung ab?"
          required
        />
      </Field>
      <Field label="Zieldomäne">
        <NativeSelect name="zielDomaene" defaultValue="planung">
          <NativeSelectOption value="planung">Planung</NativeSelectOption>
          <NativeSelectOption value="bau">Bau</NativeSelectOption>
          <NativeSelectOption value="betrieb">Betrieb</NativeSelectOption>
        </NativeSelect>
      </Field>
      <Field label="Priorität">
        <NativeSelect name="prioritaet" defaultValue="mittel">
          <NativeSelectOption value="niedrig">Niedrig</NativeSelectOption>
          <NativeSelectOption value="mittel">Mittel</NativeSelectOption>
          <NativeSelectOption value="hoch">Hoch</NativeSelectOption>
          <NativeSelectOption value="kritisch">Kritisch</NativeSelectOption>
        </NativeSelect>
      </Field>
      <Field label="Verantwortlich">
        <Input name="verantwortlich" placeholder="z. B. Bauleitung" />
      </Field>
      {planversionen.length > 0 ? (
        <Field label="Bezug Planversion (optional)">
          <NativeSelect name="planversionId" defaultValue="">
            <NativeSelectOption value="">Keine</NativeSelectOption>
            {planversionen.map((version) => (
              <NativeSelectOption key={version.id} value={version.id}>
                {version.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
    </ActionDialog>
  )
}

export function KonfliktKommentarDialog({
  konfliktId,
  rolle = "planung",
  triggerLabel = "Kommentieren",
  triggerClassName,
  open,
  onOpenChange,
  showFotoPlatzhalter = false,
}: {
  konfliktId: string
  rolle?: "bau" | "planung" | "betrieb"
  triggerLabel?: string
  triggerClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showFotoPlatzhalter?: boolean
}) {
  return (
    <ActionDialog
      triggerLabel={triggerLabel}
      triggerVariant="outline"
      triggerClassName={triggerClassName}
      title="Kommentar hinzufügen"
      submitLabel="Kommentar speichern"
      successMessage="Kommentar gespeichert."
      action={createKommentarAction}
      open={open}
      onOpenChange={onOpenChange}
    >
      <input type="hidden" name="konfliktId" value={konfliktId} />
      <input type="hidden" name="rolle" value={rolle} />
      <Field label="Autor">
        <Input name="autor" placeholder="Name / Rolle" />
      </Field>
      <Field label="Kommentar">
        <Textarea name="text" placeholder="Rückfrage oder Hinweis…" required />
      </Field>
      {showFotoPlatzhalter ? (
        <Field label="Foto-Anhang (Platzhalter)">
          <input
            type="file"
            accept="image/*"
            disabled
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-input file:bg-muted file:px-3 file:py-2 file:text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Datei-Upload folgt mit Supabase Storage (#29). Kommentar ist bereits
            nutzbar.
          </p>
        </Field>
      ) : null}
    </ActionDialog>
  )
}

export function EntscheidungDialog({
  konfliktId,
  konfliktTitel,
}: {
  konfliktId: string
  konfliktTitel: string
}) {
  return (
    <ActionDialog
      triggerLabel="Entscheidung treffen"
      title="Entscheidung dokumentieren"
      description={`Löst den Konflikt „${konfliktTitel}" und überträgt die Folgen in den Betrieb.`}
      submitLabel="Entscheidung freigeben"
      successMessage="Entscheidung dokumentiert."
      action={createEntscheidungAction}
    >
      <input type="hidden" name="konfliktId" value={konfliktId} />
      <Field label="Titel">
        <Input name="titel" placeholder="Kurztitel der Entscheidung" required />
      </Field>
      <Field label="Begründung">
        <Textarea
          name="begruendung"
          placeholder="Warum wurde so entschieden?"
          required
        />
      </Field>
      <Field label="Entschieden von">
        <Input name="entschiedenVon" placeholder="z. B. Tragwerksplanung" />
      </Field>
      <Field label="Folgen für Betrieb (eine je Zeile)">
        <Textarea
          name="folgenFuerBetrieb"
          placeholder={"Wartung Revisionspunkte\nDokumentation aktualisieren"}
        />
      </Field>
      <Field label="Konflikt danach setzen auf">
        <NativeSelect name="neuerKonfliktStatus" defaultValue="geloest">
          <NativeSelectOption value="geloest">Gelöst</NativeSelectOption>
          <NativeSelectOption value="uebernommen">
            In Betrieb übernommen
          </NativeSelectOption>
          <NativeSelectOption value="">Unverändert</NativeSelectOption>
        </NativeSelect>
      </Field>
    </ActionDialog>
  )
}

export function AssetUebergabeButton({
  assetId,
  assetName,
}: {
  assetId: string
  assetName: string
}) {
  return (
    <ActionDialog
      triggerLabel="An Betrieb übergeben"
      triggerVariant="secondary"
      title="Asset an Betrieb übergeben"
      description={`„${assetName}" wird als übergeben markiert und erscheint in der Betreiberakte.`}
      submitLabel="Übergabe bestätigen"
      successMessage="Asset an Betrieb übergeben."
      action={uebergebeAssetAction}
    >
      <input type="hidden" name="assetId" value={assetId} />
      <p className="text-sm text-muted-foreground">
        Herkunft, Wartungsstatus und Planbezug bleiben nachvollziehbar.
      </p>
    </ActionDialog>
  )
}

export { KonfliktStatusControl }
