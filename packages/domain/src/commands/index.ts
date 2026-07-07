import type {
  AenderungsQuelle,
  Aktivitaet,
  ActivityKind,
  Asset,
  AssetStatus,
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
  ForecastConfidence,
  Kostenprognose,
  Material,
  Planstand,
  PlanMarker,
  PlanMarkerTyp,
  PlanVersionStatus,
  Planversion,
  ProjectPhase,
} from "../construction-project"
import type { PlanAbweichungMarker } from "../plan-abgleich"

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

// --- markierePlanAnnotation ------------------------------------------------

export interface MarkierePlanAnnotationInput {
  projektId: DomainId
  planversionId: DomainId
  typ: PlanMarkerTyp
  xPercent: number
  yPercent: number
  titel: string
  beschreibung: string
  autor: string
  rolle: ProjectPhase
  verantwortlich?: string
  prioritaet?: ConflictSeverity
}

export function markierePlanAnnotation(
  input: MarkierePlanAnnotationInput,
  ctx: MutationContext
): MutationResult {
  const marker: PlanMarker = {
    id: ctx.newId("marker"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    planversionId: input.planversionId,
    typ: input.typ,
    xPercent: input.xPercent,
    yPercent: input.yPercent,
    titel: input.titel,
    beschreibung: input.beschreibung,
    autor: input.autor,
  }

  const upserts: MutationUpserts = { planMarker: [marker] }
  const auditEintraege: AuditEintrag[] = []
  const bezug: Aktivitaet["bezug"] = { planversionId: input.planversionId }

  if (input.typ === "konflikt") {
    const konflikt: Konflikt = {
      id: ctx.newId("konflikt"),
      createdAt: ctx.now,
      updatedAt: ctx.now,
      projektId: input.projektId,
      planversionId: input.planversionId,
      titel: input.titel,
      beschreibung: input.beschreibung,
      quelle: input.rolle,
      zielDomaene: "planung",
      status: "neu",
      prioritaet: input.prioritaet ?? "mittel",
      verantwortlich: input.verantwortlich ?? input.autor,
    }
    marker.konfliktId = konflikt.id
    upserts.konflikte = [konflikt]
    bezug.konfliktId = konflikt.id

    const aktivitaet = makeAktivitaet(ctx, {
      projektId: input.projektId,
      art: "abweichung_markiert",
      quelle: input.rolle,
      ziel: "planung",
      titel: `Konflikt markiert: ${input.titel}`,
      beschreibung: input.beschreibung,
      bezug,
    })

    auditEintraege.push(
      makeAudit(ctx, {
        projektId: input.projektId,
        entitaet: "konflikt",
        entitaetId: konflikt.id,
        feld: "status",
        vorher: null,
        nachher: "neu",
        aktivitaetId: aktivitaet.id,
      })
    )

    return { upserts, aktivitaet, auditEintraege }
  }

  const kommentar: Kommentar = {
    id: ctx.newId("kommentar"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    planversionId: input.planversionId,
    autor: input.autor,
    rolle: input.rolle,
    text: input.beschreibung,
  }
  marker.kommentarId = kommentar.id
  upserts.kommentare = [kommentar]

  const typLabels: Record<Exclude<PlanMarkerTyp, "konflikt">, string> = {
    rueckfrage: "Rückfrage",
    material: "Materialhinweis",
    sicherheit: "Sicherheitshinweis",
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.projektId,
    art: "abweichung_markiert",
    quelle: input.rolle,
    titel: `${typLabels[input.typ]} markiert: ${input.titel}`,
    beschreibung: input.beschreibung,
    bezug,
  })

  return { upserts, aktivitaet, auditEintraege }
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

// --- uebergebeAsset --------------------------------------------------------

export interface UebergebeAssetInput {
  asset: Asset
  status?: AssetStatus
}

export function uebergebeAsset(
  input: UebergebeAssetInput,
  ctx: MutationContext
): MutationResult {
  const status = input.status ?? "uebergeben"
  const updated: Asset = { ...input.asset, status, updatedAt: ctx.now }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.asset.projektId,
    art: "asset_uebergeben",
    quelle: "bau",
    ziel: "betrieb",
    titel: `Asset an Betrieb übergeben: ${input.asset.name}`,
    beschreibung: input.asset.herkunft,
    bezug: {
      assetId: input.asset.id,
      planversionId: input.asset.planversionId,
      materialId: input.asset.materialId,
    },
  })

  const audit = makeAudit(ctx, {
    projektId: input.asset.projektId,
    entitaet: "asset",
    entitaetId: input.asset.id,
    feld: "status",
    vorher: input.asset.status,
    nachher: status,
    aktivitaetId: aktivitaet.id,
  })

  return { upserts: { assets: [updated] }, aktivitaet, auditEintraege: [audit] }
}

// --- bestaetigeVisionUpdate ------------------------------------------------

export interface VisionMaterialUpdate {
  materialId: DomainId
  verbaut: number
  verbleibend: number
}

export interface BestaetigeVisionUpdateInput {
  projektId: DomainId
  materialien: Material[]
  updates: VisionMaterialUpdate[]
}

/**
 * Übernimmt bestätigte Vision-/Kamera-Ergebnisse in den Materialbestand (#75).
 * Erzeugt genau eine Aktivität (Quelle Kamera/Vision → ERP/EAP) und Audit-
 * Einträge je geändertem Feld. Nichts wird ohne diese Bestätigung geschrieben.
 */
export function bestaetigeVisionUpdate(
  input: BestaetigeVisionUpdateInput,
  ctx: MutationContext
): MutationResult {
  const materialien: Material[] = []
  const auditEintraege: AuditEintrag[] = []

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.projektId,
    art: "vision_bestaetigt",
    quelle: "bau",
    ziel: "bau",
    titel: "Kamera-Update bestätigt",
    beschreibung: `${input.updates.length} Materialposition(en) aus dem Kamera-Scan übernommen.`,
  })

  for (const update of input.updates) {
    const material = input.materialien.find(
      (item) => item.id === update.materialId
    )
    if (!material) {
      continue
    }

    const aktualisiert: Material = {
      ...material,
      verbaut: update.verbaut,
      verbleibend: update.verbleibend,
      lager: update.verbleibend,
      updatedAt: ctx.now,
    }
    materialien.push(aktualisiert)

    if (material.verbaut !== update.verbaut) {
      auditEintraege.push(
        makeAudit(ctx, {
          projektId: input.projektId,
          entitaet: "material",
          entitaetId: material.id,
          feld: "verbaut",
          vorher: String(material.verbaut),
          nachher: String(update.verbaut),
          aktivitaetId: aktivitaet.id,
        })
      )
    }
  }

  return { upserts: { materialien }, aktivitaet, auditEintraege }
}

// --- meldeMaterialSchnell --------------------------------------------------

export type MaterialSchnellArt = "bestand_niedrig" | "geliefert" | "ersatz_noetig"

const MATERIAL_SCHNELL_STATUS: Record<MaterialSchnellArt, Material["status"]> = {
  bestand_niedrig: "kritisch",
  geliefert: "geliefert",
  ersatz_noetig: "nachgekauft",
}

const MATERIAL_SCHNELL_TITEL: Record<MaterialSchnellArt, string> = {
  bestand_niedrig: "Bestand niedrig",
  geliefert: "Lieferung bestätigt",
  ersatz_noetig: "Ersatz benötigt",
}

export interface MeldeMaterialSchnellInput {
  projektId: DomainId
  material: Material
  art: MaterialSchnellArt
  notiz?: string
}

/** Schnellmeldung vom Baustellen-Handy (#25) – Status + Aktivitätslog. */
export function meldeMaterialSchnell(
  input: MeldeMaterialSchnellInput,
  ctx: MutationContext
): MutationResult {
  const neuerStatus = MATERIAL_SCHNELL_STATUS[input.art]
  const titel = `${MATERIAL_SCHNELL_TITEL[input.art]}: ${input.material.name}`
  const beschreibung =
    input.notiz?.trim() ||
    `Materialstatus auf „${neuerStatus}" gesetzt (mobile Schnellmeldung).`

  const aktualisiert: Material = {
    ...input.material,
    status: neuerStatus,
    updatedAt: ctx.now,
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.projektId,
    art: "material_aktualisiert",
    quelle: "bau",
    ziel: "bau",
    titel,
    beschreibung,
    bezug: { materialId: input.material.id },
  })

  const audit =
    input.material.status !== neuerStatus
      ? makeAudit(ctx, {
          projektId: input.projektId,
          entitaet: "material",
          entitaetId: input.material.id,
          feld: "status",
          vorher: input.material.status,
          nachher: neuerStatus,
          aktivitaetId: aktivitaet.id,
        })
      : null

  return {
    upserts: { materialien: [aktualisiert] },
    aktivitaet,
    auditEintraege: audit ? [audit] : [],
  }
}

// --- importiereErpMaterialien ------------------------------------------------

export interface ErpMaterialImportRow {
  materialId: DomainId
  bestellt?: number
  geliefert?: number
  verbaut?: number
  verbleibend?: number
}

export interface ImportiereErpMaterialienInput {
  projektId: DomainId
  materialien: Material[]
  rows: ErpMaterialImportRow[]
  quelleName?: string
}

/**
 * Übernimmt ERP/EAP-Mock-Import in den Materialbestand (#27).
 * Erzeugt eine Sync-Aktivität und Audit-Einträge je geändertem Feld.
 */
export function importiereErpMaterialien(
  input: ImportiereErpMaterialienInput,
  ctx: MutationContext
): MutationResult {
  const quelleLabel = input.quelleName?.trim() || "ERP/EAP-Import"
  const materialien: Material[] = []
  const auditEintraege: AuditEintrag[] = []

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.projektId,
    art: "erp_eap_sync",
    quelle: "erp",
    ziel: "bau",
    titel: `${quelleLabel}: Materialdaten importiert`,
    beschreibung: `${input.rows.length} Materialposition(en) aus Import übernommen.`,
  })

  for (const row of input.rows) {
    const material = input.materialien.find((item) => item.id === row.materialId)
    if (!material) {
      continue
    }

    const aktualisiert: Material = {
      ...material,
      bestellt: row.bestellt ?? material.bestellt,
      geliefert: row.geliefert ?? material.geliefert,
      verbaut: row.verbaut ?? material.verbaut,
      verbleibend: row.verbleibend ?? material.verbleibend,
      lager: row.verbleibend ?? material.verbleibend,
      updatedAt: ctx.now,
    }
    materialien.push(aktualisiert)

    for (const feld of [
      "bestellt",
      "geliefert",
      "verbaut",
      "verbleibend",
    ] as const) {
      if (row[feld] !== undefined && material[feld] !== row[feld]) {
        auditEintraege.push(
          makeAudit(ctx, {
            projektId: input.projektId,
            entitaet: "material",
            entitaetId: material.id,
            feld,
            vorher: String(material[feld]),
            nachher: String(row[feld]),
            aktivitaetId: aktivitaet.id,
          })
        )
      }
    }
  }

  return { upserts: { materialien }, aktivitaet, auditEintraege }
}

export interface SpeicherePlanAbgleichInput {
  projektId: DomainId
  planversionId: DomainId
  standortId: DomainId
  planversionLabel: string
  marker: PlanAbweichungMarker[]
}

export function speicherePlanAbgleich(
  input: SpeicherePlanAbgleichInput,
  ctx: MutationContext
): MutationResult {
  const relevant = input.marker.filter((item) => item.bewertung !== "passt")
  if (relevant.length === 0) {
    return {
      upserts: {},
      aktivitaet: makeAktivitaet(ctx, {
        projektId: input.projektId,
        art: "abweichung_markiert",
        quelle: "bau",
        ziel: "planung",
        titel: `Planabgleich ${input.planversionLabel}`,
        beschreibung: "Keine Abweichungen markiert.",
        bezug: { planversionId: input.planversionId },
      }),
      auditEintraege: [],
    }
  }

  const ab = relevant.filter((item) => item.bewertung === "abweichung")
  const uk = relevant.filter((item) => item.bewertung === "unklar")
  const gesamtMehrkostenCent = ab.length * 970_000 + uk.length * 415_000
  const zeitwirkungTage = ab.length * 2 + uk.length

  const konflikt: Konflikt = {
    id: ctx.newId("konflikt"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    planversionId: input.planversionId,
    standortId: input.standortId,
    titel: `Planabweichung: ${relevant.length} Punkt(e)`,
    beschreibung: relevant
      .map((item) => `${item.annotationLabel} (${item.bewertung})`)
      .join("; "),
    quelle: "bau",
    zielDomaene: "planung",
    status: "neu",
    prioritaet: ab.length > 0 ? "hoch" : "mittel",
    verantwortlich: "Planung Tragwerk",
    kostenwirkungCent: gesamtMehrkostenCent,
    zeitwirkungTage,
  }

  const kostenprognose: Kostenprognose = {
    id: ctx.newId("kostenprognose"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    konfliktId: konflikt.id,
    materialMehrkostenCent: Math.round(gesamtMehrkostenCent * 0.45),
    arbeitsMehrkostenCent: Math.round(gesamtMehrkostenCent * 0.35),
    bauzeitMehrkostenCent: Math.round(gesamtMehrkostenCent * 0.12),
    betriebMehrkostenCent: Math.max(
      0,
      gesamtMehrkostenCent -
        Math.round(gesamtMehrkostenCent * 0.45) -
        Math.round(gesamtMehrkostenCent * 0.35) -
        Math.round(gesamtMehrkostenCent * 0.12)
    ),
    gesamtMehrkostenCent,
    zeitwirkungTage,
    konfidenz: uk.length > 0 && ab.length === 0 ? "niedrig" : "mittel",
    annahmen: ["Schaetzung aus Plan-/Baustellen-Abgleich."],
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.projektId,
    art: "abweichung_markiert",
    quelle: "bau",
    ziel: "planung",
    titel: konflikt.titel,
    beschreibung: konflikt.beschreibung,
    bezug: {
      konfliktId: konflikt.id,
      planversionId: input.planversionId,
      kostenprognoseId: kostenprognose.id,
    },
  })

  return {
    upserts: { konflikte: [konflikt], kostenprognosen: [kostenprognose] },
    aktivitaet,
    auditEintraege: [
      makeAudit(ctx, {
        projektId: input.projektId,
        entitaet: "konflikt",
        entitaetId: konflikt.id,
        feld: "status",
        vorher: null,
        nachher: "neu",
        aktivitaetId: aktivitaet.id,
      }),
    ],
  }
}

export * from "./terminplan-commands"

export * from "./terminplan-commands"

export * from "./terminplan-commands"
