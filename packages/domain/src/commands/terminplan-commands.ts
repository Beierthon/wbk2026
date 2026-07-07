import type {
  AuditEintrag,
  Aktivitaet,
  Bauabschnitt,
  BauabschnittAbhaengigkeit,
  DomainId,
  ForecastConfidence,
  ISODate,
  Konflikt,
  Kostenprognose,
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

export type {
  VerschiebungsEingabe,
  VerschiebungsStrategie,
  VerschiebungsUrsache,
}
