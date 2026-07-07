import {
  getDemoProjectData,
  WBK_DEMO_PROJECT_ID,
  type BauprojektDatenmodell,
} from "@workspace/domain"

import type {
  PlanstandMitVersionen,
  PlanungsUebersicht,
  BauUebersicht,
  BestellungMitMaterial,
  ProjektRepository,
} from "./repository"

function requireEntity<T>(
  entity: T | undefined,
  label: string
): T {
  if (!entity) {
    throw new Error(`${label} nicht gefunden`)
  }

  return entity
}

function buildPlanungsUebersicht(
  data: BauprojektDatenmodell,
  projektId: string
): PlanungsUebersicht {
  const projekt = requireEntity(
    data.projekte.find((entry) => entry.id === projektId),
    `Projekt ${projektId}`
  )

  const standort = requireEntity(
    data.standorte.find((entry) => entry.id === projekt.standortId),
    `Standort fuer Projekt ${projektId}`
  )

  const planstaende: PlanstandMitVersionen[] = data.planstaende
    .filter((entry) => entry.projektId === projektId)
    .map((planstand) => {
      const versionen = data.planversionen.filter(
        (version) => version.planstandId === planstand.id
      )
      const aktuelleVersion = requireEntity(
        versionen.find((version) => version.id === planstand.aktuelleVersionId),
        `Aktuelle Planversion fuer ${planstand.id}`
      )

      return {
        ...planstand,
        versionen,
        aktuelleVersion,
      }
    })

  return {
    projekt,
    standort,
    planstaende,
    konflikte: data.konflikte.filter((entry) => entry.projektId === projektId),
    kommentare: data.kommentare.filter(
      (entry) => entry.projektId === projektId
    ),
    entscheidungen: data.entscheidungen.filter(
      (entry) => entry.projektId === projektId
    ),
  }
}

function buildBauUebersicht(
  data: BauprojektDatenmodell,
  projektId: string
): BauUebersicht {
  const projekt = requireEntity(
    data.projekte.find((entry) => entry.id === projektId),
    `Projekt ${projektId}`
  )

  const standort = requireEntity(
    data.standorte.find((entry) => entry.id === projekt.standortId),
    `Standort fuer Projekt ${projektId}`
  )

  const materialien = data.materialien.filter(
    (entry) => entry.projektId === projektId
  )

  const materialById = new Map(materialien.map((entry) => [entry.id, entry]))

  const bestellungen: BestellungMitMaterial[] = data.bestellungen
    .filter((entry) => entry.projektId === projektId)
    .map((bestellung) => {
      const material = requireEntity(
        materialById.get(bestellung.materialId),
        `Material ${bestellung.materialId}`
      )

      return {
        ...bestellung,
        materialName: material.name,
        materialEinheit: material.einheit,
        externeReferenz: bestellung.externeReferenzId
          ? data.externeReferenzen.find(
              (entry) => entry.id === bestellung.externeReferenzId
            )
          : undefined,
      }
    })

  const aktivitaeten = data.aktivitaeten
    .filter((entry) => entry.projektId === projektId)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )

  return {
    projekt,
    standort,
    materialien,
    bestellungen,
    konflikte: data.konflikte.filter((entry) => entry.projektId === projektId),
    kommentare: data.kommentare.filter(
      (entry) => entry.projektId === projektId
    ),
    aktivitaeten,
    externeReferenzen: data.externeReferenzen.filter(
      (entry) => entry.projektId === projektId
    ),
  }
}

export function createMockProjektRepository(
  data: BauprojektDatenmodell = getDemoProjectData()
): ProjektRepository {
  return {
    async getPlanungsUebersicht(projektId) {
      return buildPlanungsUebersicht(data, projektId)
    },
    async getBauUebersicht(projektId) {
      return buildBauUebersicht(data, projektId)
    },
  }
}

export const mockProjektRepository = createMockProjektRepository()

export { WBK_DEMO_PROJECT_ID }
