import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Input } from "@workspace/ui/components/input"
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
      triggerLabel="Publish version"
      title="Publish plan version"
      submitLabel="Publish"
      successMessage="New plan version published."
      action={publishPlanversionAction}
    >
      <Field label="Plan set">
        <NativeSelect name="planstandId" required>
          {planstaende.map((planstand) => (
            <NativeSelectOption key={planstand.id} value={planstand.id}>
              {planstand.titel} (current {planstand.aktuelleVersion})
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field label="New version label">
        <Input name="version" placeholder="e.g. TWP-GRU-1.2" required />
      </Field>
      <Field label="Published by">
        <Input name="veroeffentlichtVon" placeholder="Design team" />
      </Field>
      <Field label="Change note">
        <Textarea
          name="aenderungsnotiz"
          placeholder="What was changed?"
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
  triggerLabel = "Submit report",
}: {
  planversionen?: PlanversionOption[]
  quelle?: "bau" | "planung" | "betrieb"
  triggerLabel?: string
}) {
  return (
    <ActionDialog
      triggerLabel={triggerLabel}
      triggerVariant="outline"
      title="Report conflict"
      submitLabel="Submit"
      successMessage="Conflict reported."
      action={meldeKonfliktAction}
    >
      <input type="hidden" name="quelle" value={quelle} />
      <Field label="Title">
        <Input name="titel" placeholder="Short description" required />
      </Field>
      <Field label="Description">
        <Textarea
          name="beschreibung"
          placeholder="What deviates from the plan?"
          required
        />
      </Field>
      <Field label="Target domain">
        <NativeSelect name="zielDomaene" defaultValue="planung">
          <NativeSelectOption value="planung">Planning</NativeSelectOption>
          <NativeSelectOption value="bau">Construction</NativeSelectOption>
          <NativeSelectOption value="betrieb">Operations</NativeSelectOption>
        </NativeSelect>
      </Field>
      <Field label="Priority">
        <NativeSelect name="prioritaet" defaultValue="mittel">
          <NativeSelectOption value="niedrig">Low</NativeSelectOption>
          <NativeSelectOption value="mittel">Medium</NativeSelectOption>
          <NativeSelectOption value="hoch">High</NativeSelectOption>
          <NativeSelectOption value="kritisch">Critical</NativeSelectOption>
        </NativeSelect>
      </Field>
      <Field label="Owner">
        <Input name="verantwortlich" placeholder="e.g. Site management" />
      </Field>
      {planversionen.length > 0 ? (
        <Field label="Related plan version (optional)">
          <NativeSelect name="planversionId" defaultValue="">
            <NativeSelectOption value="">None</NativeSelectOption>
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
  triggerLabel = "Comment",
  triggerClassName,
  open,
  onOpenChange,
}: {
  konfliktId: string
  rolle?: "bau" | "planung" | "betrieb"
  triggerLabel?: string
  triggerClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <ActionDialog
      triggerLabel={triggerLabel}
      triggerVariant="outline"
      triggerClassName={triggerClassName}
      title="Add comment"
      submitLabel="Save comment"
      successMessage="Comment saved."
      action={createKommentarAction}
      open={open}
      onOpenChange={onOpenChange}
    >
      <input type="hidden" name="konfliktId" value={konfliktId} />
      <input type="hidden" name="rolle" value={rolle} />
      <Field label="Author">
        <Input name="autor" placeholder="Name / role" />
      </Field>
      <Field label="Comment">
        <Textarea
          name="text"
          placeholder="Follow-up question or note…"
          required
        />
      </Field>
    </ActionDialog>
  )
}

export function EntscheidungDialog({
  konfliktId,
}: {
  konfliktId: string
  konfliktTitel: string
}) {
  return (
    <ActionDialog
      triggerLabel="Decision"
      title="Document decision"
      submitLabel="Approve"
      successMessage="Decision documented."
      action={createEntscheidungAction}
    >
      <input type="hidden" name="konfliktId" value={konfliktId} />
      <Field label="Title">
        <Input name="titel" placeholder="Short decision title" required />
      </Field>
      <Field label="Rationale">
        <Textarea
          name="begruendung"
          placeholder="Why was this decided?"
          required
        />
      </Field>
      <Field label="Decided by">
        <Input name="entschiedenVon" placeholder="e.g. Structural design" />
      </Field>
      <Field label="Operations implications (one per line)">
        <Textarea
          name="folgenFuerBetrieb"
          placeholder={"Maintenance inspection points\nUpdate documentation"}
        />
      </Field>
      <Field label="Set conflict status to">
        <NativeSelect name="neuerKonfliktStatus" defaultValue="geloest">
          <NativeSelectOption value="geloest">Resolved</NativeSelectOption>
          <NativeSelectOption value="uebernommen">
            Adopted into operations
          </NativeSelectOption>
          <NativeSelectOption value="">Unchanged</NativeSelectOption>
        </NativeSelect>
      </Field>
    </ActionDialog>
  )
}

export function AssetUebergabeButton({
  assetId,
}: {
  assetId: string
  assetName: string
}) {
  return (
    <ActionDialog
      triggerLabel="Hand over"
      triggerVariant="secondary"
      title="Hand over to operations"
      submitLabel="Confirm"
      successMessage="Asset handed over to operations."
      action={uebergebeAssetAction}
    >
      <input type="hidden" name="assetId" value={assetId} />
    </ActionDialog>
  )
}

export { KonfliktStatusControl }
