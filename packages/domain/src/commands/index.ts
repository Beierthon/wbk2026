import type {
  AenderungsQuelle,
  Aktivitaet,
  ActivityKind,
  AuditEintrag,
  BauprojektDatenmodell,
  ConflictSeverity,
  ConflictStatus,
  DecisionStatus,
  DomainId,
  Entscheidung,
  ISODate,
  ISODateTime,
  Kommentar,
  Konflikt,
  Planstand,
  PlanVersionStatus,
  Planversion,
  ProjectPhase,
} from "../construction-project"

/**
 * Kontext für eine Mutation. Zeit und ID-Erzeugung werden injiziert, damit die
 * Commands pure Funktionen bleiben (deterministisch testbar).
 */
export interface MutationContext {
  actor: string
  quelle: AenderungsQuelle
  geraet?: "desktop" | "mobil"
  now: ISODateTime
  newId: (prefix: string) => DomainId
}

/** Zu schreibende Entitäten je Tabelle (upsert nach id). */
export type MutationUpserts = Partial<{
  [K in keyof BauprojektDatenmodell]: BauprojektDatenmodell[K]
}>

/**
 * Ergebnis jeder Mutation. `aktivitaet` und `auditEintraege` sind Teil des
 * Rückgabetyps, damit Aktivitätslog (#9) und Audit Trail (#31) nicht vergessen
 * werden können. Beide Adapter (mock/supabase) persistieren identisch.
 */
export interface MutationResult {
  upserts: MutationUpserts
  aktivitaet: Aktivitaet
  auditEintraege: AuditEintrag[]
}

interface AktivitaetInput {
  projektId: DomainId
  art: ActivityKind
  quelle: Aktivitaet["quelle"]
  ziel?: ProjectPhase
  titel: string
  beschreibung: string
  bezug?: Aktivitaet["bezug"]
}

function makeAktivitaet(ctx: MutationContext, input: AktivitaetInput): Aktivitaet {
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

function makeAudit(ctx: MutationContext, input: AuditInput): AuditEintrag {
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

// --- createKommentar -------------------------------------------------------

export interface CreateKommentarInput {
  projektId: DomainId
  konfliktId?: DomainId
  planversionId?: DomainId
  autor: string
  rolle: ProjectPhase
  text: string
}

export function createKommentar(
  input: CreateKommentarInput,
  ctx: MutationContext
): MutationResult {
  const kommentar: Kommentar = {
    id: ctx.newId("kommentar"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    konfliktId: input.konfliktId,
    planversionId: input.planversionId,
    autor: input.autor,
    rolle: input.rolle,
    text: input.text,
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.projektId,
    art: "kommentar_erstellt",
    quelle: input.rolle,
    titel: `Neuer Kommentar von ${input.autor}`,
    beschreibung: input.text,
    bezug: {
      konfliktId: input.konfliktId,
      planversionId: input.planversionId,
    },
  })

  return { upserts: { kommentare: [kommentar] }, aktivitaet, auditEintraege: [] }
}

// --- meldeKonflikt ---------------------------------------------------------

export interface MeldeKonfliktInput {
  projektId: DomainId
  planversionId?: DomainId
  standortId?: DomainId
  titel: string
  beschreibung: string
  quelle: ProjectPhase
  zielDomaene: ProjectPhase
  prioritaet: ConflictSeverity
  verantwortlich: string
  faelligAm?: ISODate
  kostenwirkungCent?: number
  zeitwirkungTage?: number
}

export function meldeKonflikt(
  input: MeldeKonfliktInput,
  ctx: MutationContext
): MutationResult {
  const konflikt: Konflikt = {
    id: ctx.newId("konflikt"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    planversionId: input.planversionId,
    standortId: input.standortId,
    titel: input.titel,
    beschreibung: input.beschreibung,
    quelle: input.quelle,
    zielDomaene: input.zielDomaene,
    status: "neu",
    prioritaet: input.prioritaet,
    verantwortlich: input.verantwortlich,
    faelligAm: input.faelligAm,
    kostenwirkungCent: input.kostenwirkungCent,
    zeitwirkungTage: input.zeitwirkungTage,
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.projektId,
    art: "konflikt_gemeldet",
    quelle: input.quelle,
    ziel: input.zielDomaene,
    titel: input.titel,
    beschreibung: input.beschreibung,
    bezug: { konfliktId: konflikt.id, planversionId: input.planversionId },
  })

  const audit = makeAudit(ctx, {
    projektId: input.projektId,
    entitaet: "konflikt",
    entitaetId: konflikt.id,
    feld: "status",
    vorher: null,
    nachher: "neu",
    aktivitaetId: aktivitaet.id,
  })

  return { upserts: { konflikte: [konflikt] }, aktivitaet, auditEintraege: [audit] }
}

// --- updateKonfliktStatus --------------------------------------------------

export interface UpdateKonfliktStatusInput {
  status: ConflictStatus
  actorRolle?: ProjectPhase
}

export function updateKonfliktStatus(
  konflikt: Konflikt,
  input: UpdateKonfliktStatusInput,
  ctx: MutationContext
): MutationResult {
  const updated: Konflikt = { ...konflikt, status: input.status, updatedAt: ctx.now }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: konflikt.projektId,
    art: "konflikt_status_geaendert",
    quelle: input.actorRolle ?? konflikt.zielDomaene,
    titel: `Konfliktstatus geändert: ${konflikt.status} → ${input.status}`,
    beschreibung: konflikt.titel,
    bezug: { konfliktId: konflikt.id },
  })

  const audit = makeAudit(ctx, {
    projektId: konflikt.projektId,
    entitaet: "konflikt",
    entitaetId: konflikt.id,
    feld: "status",
    vorher: konflikt.status,
    nachher: input.status,
    aktivitaetId: aktivitaet.id,
  })

  return { upserts: { konflikte: [updated] }, aktivitaet, auditEintraege: [audit] }
}

// --- publishPlanversion ----------------------------------------------------

export interface PublishPlanversionInput {
  planstand: Planstand
  aktuelleVersion?: Planversion
  version: string
  aenderungsnotiz: string
  veroeffentlichtVon: string
  status?: PlanVersionStatus
  dateiReferenz?: string
}

export function publishPlanversion(
  input: PublishPlanversionInput,
  ctx: MutationContext
): MutationResult {
  const status = input.status ?? "freigegeben"

  const neu: Planversion = {
    id: ctx.newId("planversion"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    planstandId: input.planstand.id,
    version: input.version,
    status,
    veroeffentlichtVon: input.veroeffentlichtVon,
    veroeffentlichtAm: ctx.now,
    dateiReferenz: input.dateiReferenz,
    aenderungsnotiz: input.aenderungsnotiz,
  }

  const planversionen: Planversion[] = [neu]
  const auditEintraege: AuditEintrag[] = []

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.planstand.projektId,
    art: "plan_veroeffentlicht",
    quelle: "planung",
    ziel: "bau",
    titel: `Planversion ${input.version} veröffentlicht`,
    beschreibung: input.aenderungsnotiz,
    bezug: { planversionId: neu.id },
  })

  if (input.aktuelleVersion && status === "freigegeben") {
    planversionen.push({
      ...input.aktuelleVersion,
      status: "ersetzt",
      updatedAt: ctx.now,
    })
    auditEintraege.push(
      makeAudit(ctx, {
        projektId: input.planstand.projektId,
        entitaet: "planversion",
        entitaetId: input.aktuelleVersion.id,
        feld: "status",
        vorher: input.aktuelleVersion.status,
        nachher: "ersetzt",
        aktivitaetId: aktivitaet.id,
      })
    )
  }

  const planstandUpdated: Planstand = {
    ...input.planstand,
    aktuelleVersionId: neu.id,
    updatedAt: ctx.now,
  }

  auditEintraege.push(
    makeAudit(ctx, {
      projektId: input.planstand.projektId,
      entitaet: "planstand",
      entitaetId: input.planstand.id,
      feld: "aktuelleVersionId",
      vorher: input.planstand.aktuelleVersionId,
      nachher: neu.id,
      aktivitaetId: aktivitaet.id,
    })
  )

  return {
    upserts: { planversionen, planstaende: [planstandUpdated] },
    aktivitaet,
    auditEintraege,
  }
}

// --- createEntscheidung ----------------------------------------------------

export interface CreateEntscheidungInput {
  konflikt: Konflikt
  titel: string
  begruendung: string
  entschiedenVon: string
  folgenFuerBetrieb?: string[]
  status?: DecisionStatus
  neuerKonfliktStatus?: ConflictStatus
}

export function createEntscheidung(
  input: CreateEntscheidungInput,
  ctx: MutationContext
): MutationResult {
  const status = input.status ?? "freigegeben"

  const entscheidung: Entscheidung = {
    id: ctx.newId("entscheidung"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.konflikt.projektId,
    konfliktId: input.konflikt.id,
    titel: input.titel,
    begruendung: input.begruendung,
    status,
    entschiedenVon: input.entschiedenVon,
    entschiedenAm: ctx.now,
    folgenFuerBetrieb: input.folgenFuerBetrieb ?? [],
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.konflikt.projektId,
    art: "entscheidung_getroffen",
    quelle: "planung",
    ziel: "betrieb",
    titel: input.titel,
    beschreibung: input.begruendung,
    bezug: { entscheidungId: entscheidung.id, konfliktId: input.konflikt.id },
  })

  const auditEintraege: AuditEintrag[] = [
    makeAudit(ctx, {
      projektId: input.konflikt.projektId,
      entitaet: "entscheidung",
      entitaetId: entscheidung.id,
      feld: "status",
      vorher: null,
      nachher: status,
      aktivitaetId: aktivitaet.id,
    }),
  ]

  const upserts: MutationUpserts = { entscheidungen: [entscheidung] }

  if (
    input.neuerKonfliktStatus &&
    input.neuerKonfliktStatus !== input.konflikt.status
  ) {
    upserts.konflikte = [
      { ...input.konflikt, status: input.neuerKonfliktStatus, updatedAt: ctx.now },
    ]
    auditEintraege.push(
      makeAudit(ctx, {
        projektId: input.konflikt.projektId,
        entitaet: "konflikt",
        entitaetId: input.konflikt.id,
        feld: "status",
        vorher: input.konflikt.status,
        nachher: input.neuerKonfliktStatus,
        aktivitaetId: aktivitaet.id,
      })
    )
  }

  return { upserts, aktivitaet, auditEintraege }
}
