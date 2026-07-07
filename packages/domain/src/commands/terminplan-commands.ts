import type {
  AuditEintrag,
  Aktivitaet,
  Bauabschnitt,
  BauabschnittAbhaengigkeit,
  BauabschnittMaterialbedarf,
  Bestellung,
  DomainId,
  ForecastConfidence,
  ISODate,
  Konflikt,
  Kostenprognose,
  Material,
  TerminplanBlockierung,
  TerminplanSzenario,
  TerminplanVerschiebung,
  VerschiebungsStrategie,
  VerschiebungsUrsache,
} from "../construction-project"
import {
  wendeVerschiebungsStrategie,
  type VerschiebungsEingabe,
} from "../terminplan/verschiebungs-strategien"
import { berechneKritischerPfad } from "../terminplan/schedule-engine"
import {
  engpaesseNachAbhaengigkeit,
  erkenneMaterialengpaesse,
  materialbedarfFuerAbschnitte,
  type MaterialEngpass,
} from "../terminplan/inventory-reschedule"
import type { MutationContext, MutationResult } from "./index"
import { makeAktivitaet, makeAudit } from "./terminplan-helpers"

export { makeAktivitaet, makeAudit } from "./terminplan-helpers"

export interface VerschiebeBauabschnittInput {
  eingabe: VerschiebungsEingabe
  szenarioId: DomainId
  bauabschnitte: Bauabschnitt[]
  abhaengigkeiten: BauabschnittAbhaengigkeit[]
  bisherigeVerschiebungen: TerminplanVerschiebung[]
  kostenwirkungCent?: number
}

export function verschiebeBauabschnitt(
  input: VerschiebeBauabschnittInput,
  ctx: MutationContext
): MutationResult {
  const vorschau = wendeVerschiebungsStrategie(
    input.eingabe,
    input.bauabschnitte,
    input.abhaengigkeiten,
    input.bisherigeVerschiebungen
  )

  const verschiebungen: TerminplanVerschiebung[] = vorschau.verschiebungen.map(
    (v, index) => ({
      id: ctx.newId("verschiebung"),
      createdAt: ctx.now,
      updatedAt: ctx.now,
      projektId: input.bauabschnitte[0]?.projektId ?? "",
      szenarioId: input.szenarioId,
      bauabschnittId: v.bauabschnittId,
      konfliktId: v.konfliktId,
      materialId: v.materialId,
      mitarbeiterId: v.mitarbeiterId,
      ursache: v.ursache,
      strategie: v.strategie,
      tageVerschoben: v.tageVerschoben,
      grund: v.grund,
      entschiedenVon: v.entschiedenVon,
      kostenwirkungCent: index === 0 ? input.kostenwirkungCent : undefined,
      zeitwirkungKumuliertTage: v.zeitwirkungKumuliertTage,
      vorherStart: v.vorherStart,
      vorherEnde: v.vorherEnde,
      nachherStart: v.nachherStart,
      nachherEnde: v.nachherEnde,
    })
  )

  const auditEintraege: AuditEintrag[] = []
  for (const abschnitt of vorschau.betroffeneAbschnitte) {
    const alt = input.bauabschnitte.find((a) => a.id === abschnitt.id)
    if (!alt) continue
    auditEintraege.push(
      makeAudit(ctx, {
        projektId: abschnitt.projektId,
        entitaet: "bauabschnitt",
        entitaetId: abschnitt.id,
        feld: "geplanterStart",
        vorher: alt.geplanterStart,
        nachher: abschnitt.geplanterStart,
      })
    )
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.bauabschnitte[0]?.projektId ?? "",
    art: "bauabschnitt_verschoben",
    quelle: "bau",
    titel: `Bauabschnitt verschoben (+${input.eingabe.tage} Tage)`,
    beschreibung: input.eingabe.grund,
    bezug: {
      bauabschnittId: input.eingabe.bauabschnittId,
      szenarioId: input.szenarioId,
      konfliktId: input.eingabe.konfliktId,
    },
  })

  return {
    upserts: {
      bauabschnitte: vorschau.betroffeneAbschnitte.map((a) => ({
        ...a,
        updatedAt: ctx.now,
      })),
      terminplanVerschiebungen: verschiebungen,
    },
    aktivitaet,
    auditEintraege,
  }
}

export interface BlockiereBauabschnittInput {
  projektId: DomainId
  bauabschnittId: DomainId
  blockiertDurchTyp: TerminplanBlockierung["blockiertDurchTyp"]
  blockiertDurchId: DomainId
  blockiertSeit: ISODate
  geschaetztFreiAb?: ISODate
  bauabschnitt: Bauabschnitt
}

export function blockiereBauabschnitt(
  input: BlockiereBauabschnittInput,
  ctx: MutationContext
): MutationResult {
  const blockierung: TerminplanBlockierung = {
    id: ctx.newId("blockierung"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    bauabschnittId: input.bauabschnittId,
    blockiertDurchTyp: input.blockiertDurchTyp,
    blockiertDurchId: input.blockiertDurchId,
    blockiertSeit: input.blockiertSeit,
    geschaetztFreiAb: input.geschaetztFreiAb,
    status: "aktiv",
  }

  const updatedAbschnitt: Bauabschnitt = {
    ...input.bauabschnitt,
    status: "blockiert",
    updatedAt: ctx.now,
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.projektId,
    art: "bauabschnitt_blockiert",
    quelle: "bau",
    titel: `Bauabschnitt blockiert: ${input.bauabschnitt.titel}`,
    beschreibung: `Blockiert durch ${input.blockiertDurchTyp}`,
    bezug: { bauabschnittId: input.bauabschnittId },
  })

  return {
    upserts: {
      bauabschnitte: [updatedAbschnitt],
      terminplanBlockierungen: [blockierung],
    },
    aktivitaet,
    auditEintraege: [
      makeAudit(ctx, {
        projektId: input.projektId,
        entitaet: "bauabschnitt",
        entitaetId: input.bauabschnittId,
        feld: "status",
        vorher: input.bauabschnitt.status,
        nachher: "blockiert",
        aktivitaetId: aktivitaet.id,
      }),
    ],
  }
}

export function loeseBlockierung(
  blockierung: TerminplanBlockierung,
  bauabschnitt: Bauabschnitt,
  ctx: MutationContext
): MutationResult {
  const updatedBlockierung: TerminplanBlockierung = {
    ...blockierung,
    status: "aufgeloest",
    updatedAt: ctx.now,
  }

  const updatedAbschnitt: Bauabschnitt = {
    ...bauabschnitt,
    status: bauabschnitt.status === "blockiert" ? "bereit" : bauabschnitt.status,
    updatedAt: ctx.now,
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: blockierung.projektId,
    art: "bauabschnitt_blockiert",
    quelle: "bau",
    titel: `Blockierung aufgelöst: ${bauabschnitt.titel}`,
    beschreibung: `Blockierung ${blockierung.id} aufgelöst.`,
    bezug: { bauabschnittId: bauabschnitt.id },
  })

  return {
    upserts: {
      bauabschnitte: [updatedAbschnitt],
      terminplanBlockierungen: [updatedBlockierung],
    },
    aktivitaet,
    auditEintraege: [],
  }
}

export interface WechsleSzenarioInput {
  projektId: DomainId
  szenarien: TerminplanSzenario[]
  zielSzenarioId: DomainId
}

export function wechsleSzenario(
  input: WechsleSzenarioInput,
  ctx: MutationContext
): MutationResult {
  const updated = input.szenarien.map((s) => ({
    ...s,
    istAktiv: s.id === input.zielSzenarioId,
    updatedAt: ctx.now,
  }))

  const ziel = updated.find((s) => s.id === input.zielSzenarioId)

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: input.projektId,
    art: "szenario_gewechselt",
    quelle: "planung",
    titel: `Szenario gewechselt: ${ziel?.name ?? input.zielSzenarioId}`,
    beschreibung: ziel?.beschreibung ?? "",
    bezug: { szenarioId: input.zielSzenarioId },
  })

  return {
    upserts: { terminplanSzenarien: updated },
    aktivitaet,
    auditEintraege: [],
  }
}

export interface ErstelleKostenprognoseAusVerschiebungInput {
  projektId: DomainId
  konfliktId?: DomainId
  verzugTage: number
  materialMehrkostenCent: number
  arbeitsMehrkostenCent: number
  bauzeitMehrkostenCent: number
  konfidenz: ForecastConfidence
  annahmen: string[]
}

export function erstelleKostenprognoseAusVerschiebung(
  input: ErstelleKostenprognoseAusVerschiebungInput,
  ctx: MutationContext
): Kostenprognose {
  const gesamt =
    input.materialMehrkostenCent +
    input.arbeitsMehrkostenCent +
    input.bauzeitMehrkostenCent

  return {
    id: ctx.newId("kostenprognose"),
    createdAt: ctx.now,
    updatedAt: ctx.now,
    projektId: input.projektId,
    konfliktId: input.konfliktId,
    materialMehrkostenCent: input.materialMehrkostenCent,
    arbeitsMehrkostenCent: input.arbeitsMehrkostenCent,
    bauzeitMehrkostenCent: input.bauzeitMehrkostenCent,
    betriebMehrkostenCent: 0,
    gesamtMehrkostenCent: gesamt,
    zeitwirkungTage: input.verzugTage,
    konfidenz: input.konfidenz,
    annahmen: input.annahmen,
  }
}

export function verknuepfeKonfliktMitBauabschnitt(
  konflikt: Konflikt,
  bauabschnitt: Bauabschnitt,
  ctx: MutationContext
): MutationResult {
  const updated: Bauabschnitt = {
    ...bauabschnitt,
    konfliktIds: [...new Set([...bauabschnitt.konfliktIds, konflikt.id])],
    updatedAt: ctx.now,
  }

  const aktivitaet = makeAktivitaet(ctx, {
    projektId: konflikt.projektId,
    art: "terminplan_berechnet",
    quelle: konflikt.quelle,
    titel: `Konflikt mit Bauabschnitt verknüpft`,
    beschreibung: konflikt.titel,
    bezug: { konfliktId: konflikt.id, bauabschnittId: bauabschnitt.id },
  })

  return {
    upserts: { bauabschnitte: [updated] },
    aktivitaet,
    auditEintraege: [],
  }
}

export function berechneTerminplanSnapshot(
  projektId: DomainId,
  bauabschnitte: Bauabschnitt[],
  abhaengigkeiten: BauabschnittAbhaengigkeit[],
  szenarioId: DomainId,
  ctx: MutationContext
): MutationResult {
  const pfad = berechneKritischerPfad(bauabschnitte, abhaengigkeiten)

  const aktivitaet = makeAktivitaet(ctx, {
    projektId,
    art: "terminplan_berechnet",
    quelle: "planung",
    titel: "Terminplan neu berechnet",
    beschreibung: `Kritischer Pfad: ${pfad.gesamtDauerTage} Tage, Ende ${pfad.enddatum}`,
    bezug: { szenarioId },
  })

  return { upserts: {}, aktivitaet, auditEintraege: [] }
}

export interface PruefeBestandUndVerschiebeInput {
  projektId: DomainId
  szenarioId: DomainId
  bauabschnitte: Bauabschnitt[]
  abhaengigkeiten: BauabschnittAbhaengigkeit[]
  materialbedarf: BauabschnittMaterialbedarf[]
  materialien: Material[]
  bestellungen: Bestellung[]
  bisherigeVerschiebungen: TerminplanVerschiebung[]
  bisherigeBlockierungen: TerminplanBlockierung[]
  entschiedenVon: string
  bezugsDatum?: ISODate
}

function mergeMutationResults(
  acc: MutationResult,
  next: MutationResult
): MutationResult {
  const mergeList = <T extends { id: string }>(
    key: keyof MutationResult["upserts"],
    items: T[] | undefined
  ) => {
    if (!items?.length) return
    const existing = ((acc.upserts[key] as T[] | undefined) ?? []).slice()
    const byId = new Map(existing.map((item) => [item.id, item]))
    for (const item of items) {
      byId.set(item.id, item)
    }
    acc.upserts[key] = [...byId.values()] as never
  }

  mergeList("bauabschnitte", next.upserts.bauabschnitte)
  mergeList("terminplanVerschiebungen", next.upserts.terminplanVerschiebungen)
  mergeList("terminplanBlockierungen", next.upserts.terminplanBlockierungen)
  mergeList("kostenprognosen", next.upserts.kostenprognosen)

  acc.auditEintraege.push(...next.auditEintraege)
  return acc
}

export function pruefeBestandUndVerschiebeTerminplan(
  input: PruefeBestandUndVerschiebeInput,
  ctx: MutationContext
): MutationResult & { materialEngpaesse: MaterialEngpass[] } {
  const bedarf = materialbedarfFuerAbschnitte(
    input.bauabschnitte,
    input.materialbedarf,
    input.materialien
  )
  const engpaesse = erkenneMaterialengpaesse(
    input.bauabschnitte,
    bedarf,
    input.materialien,
    input.bestellungen
  )

  if (engpaesse.length === 0) {
    const aktivitaet = makeAktivitaet(ctx, {
      projektId: input.projektId,
      art: "terminplan_berechnet",
      quelle: "planung",
      titel: "Bestandsprüfung ohne Materialverzug",
      beschreibung: "Alle erforderlichen Materialien sind für die geplanten Bauabschnitte verfügbar.",
      bezug: { szenarioId: input.szenarioId },
    })
    return { upserts: {}, aktivitaet, auditEintraege: [], materialEngpaesse: [] }
  }

  let currentAbschnitte = [...input.bauabschnitte]
  let bisherigeVerschiebungen = [...input.bisherigeVerschiebungen]
  let result: MutationResult = {
    upserts: {},
    aktivitaet: makeAktivitaet(ctx, {
      projektId: input.projektId,
      art: "terminplan_berechnet",
      quelle: "planung",
      titel: "Terminplan wegen Materialverzug angepasst",
      beschreibung: `${engpaesse.length} Materialengpässe erkannt.`,
      bezug: { szenarioId: input.szenarioId },
    }),
    auditEintraege: [],
  }

  const orderedEngpaesse = engpaesseNachAbhaengigkeit(engpaesse, currentAbschnitte)

  for (const engpass of orderedEngpaesse) {
    const abschnitt = currentAbschnitte.find((a) => a.id === engpass.bauabschnittId)
    if (!abschnitt || engpass.verzugTage <= 0) continue

    const shiftResult = verschiebeBauabschnitt(
      {
        eingabe: {
          bauabschnittId: engpass.bauabschnittId,
          tage: engpass.verzugTage,
          strategie: "kaskade",
          ursache: "material_verzug",
          grund: engpass.grund,
          entschiedenVon: input.entschiedenVon,
          materialId: engpass.materialId,
        },
        szenarioId: input.szenarioId,
        bauabschnitte: currentAbschnitte,
        abhaengigkeiten: input.abhaengigkeiten,
        bisherigeVerschiebungen,
      },
      ctx
    )

    result = mergeMutationResults(result, shiftResult)

    for (const updated of shiftResult.upserts.bauabschnitte ?? []) {
      const index = currentAbschnitte.findIndex((a) => a.id === updated.id)
      if (index >= 0) {
        currentAbschnitte[index] = updated
      }
    }

    bisherigeVerschiebungen = [
      ...bisherigeVerschiebungen,
      ...(shiftResult.upserts.terminplanVerschiebungen ?? []),
    ]

    const alreadyBlocked = input.bisherigeBlockierungen.some(
      (b) =>
        b.bauabschnittId === engpass.bauabschnittId &&
        b.blockiertDurchTyp === "material" &&
        b.blockiertDurchId === engpass.materialId &&
        b.status === "aktiv"
    )

    if (!alreadyBlocked) {
      const blockResult = blockiereBauabschnitt(
        {
          projektId: input.projektId,
          bauabschnittId: engpass.bauabschnittId,
          blockiertDurchTyp: "material",
          blockiertDurchId: engpass.materialId,
          blockiertSeit: input.bezugsDatum ?? ctx.now.slice(0, 10),
          geschaetztFreiAb: engpass.freigabeAb,
          bauabschnitt: currentAbschnitte.find((a) => a.id === engpass.bauabschnittId)!,
        },
        ctx
      )
      result = mergeMutationResults(result, blockResult)
      for (const updated of blockResult.upserts.bauabschnitte ?? []) {
        const index = currentAbschnitte.findIndex((a) => a.id === updated.id)
        if (index >= 0) {
          currentAbschnitte[index] = updated
        }
      }
    }
  }

  return { ...result, materialEngpaesse: engpaesse }
}

export type {
  VerschiebungsEingabe,
  VerschiebungsStrategie,
  VerschiebungsUrsache,
}
