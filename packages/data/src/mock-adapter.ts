import {
  getDemoProjectData,
  WBK_DEMO_PROJECT_ID,
  type BauprojektDatenmodell,
} from "@workspace/domain"

import type {
  PlanstandMitVersionen,
  PlanungsUebersicht,
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

export function createMockProjektRepository(
  data: BauprojektDatenmodell = getDemoProjectData()
): ProjektRepository {
  return {
    async getPlanungsUebersicht(projektId) {
      return buildPlanungsUebersicht(data, projektId)
    },
  }
}

export const mockProjektRepository = createMockProjektRepository()

export { WBK_DEMO_PROJECT_ID }
