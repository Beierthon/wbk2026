import type { Aktivitaet, AuditEintrag, DomainId, ProjectPhase } from "../construction-project"
import type { MutationContext } from "./index"

interface AktivitaetInput {
  projektId: DomainId
  art: Aktivitaet["art"]
  quelle: ProjectPhase | Aktivitaet["quelle"]
  ziel?: ProjectPhase
  titel: string
  beschreibung: string
  bezug?: Aktivitaet["bezug"]
}

export function makeAktivitaet(ctx: MutationContext, input: AktivitaetInput): Aktivitaet {
  return {
    id: ctx.newId("aktivitaet"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    art: input.art,
    quelle: input.quelle,
    ziel: input.ziel,
    titel: input.titel,
    beschreibung: input.beschreibung,
    bezug: input.bezug ?? {},
  }
}

interface AuditInput {
  projektId: DomainId
  entitaet: string
  entitaetId: DomainId
  feld: string
  vorher: string | null
  nachher: string | null
  aktivitaetId?: DomainId
}

export function makeAudit(ctx: MutationContext, input: AuditInput): AuditEintrag {
  return {
    id: ctx.newId("audit"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    entitaet: input.entitaet,
    entitaetId: input.entitaetId,
    feld: input.feld,
    vorher: input.vorher,
    nachher: input.nachher,
    quelle: ctx.quelle,
    actor: ctx.actor,
    aktivitaetId: input.aktivitaetId,
  }
}
