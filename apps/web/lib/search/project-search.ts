import { formatEuroFromCent } from "@/components/dashboard/formatters"
import type { ProjectDashboardData } from "@/lib/data/types"
import type { ProjectPhase } from "@workspace/domain"

export type SearchEntityKind =
  | "konflikt"
  | "planversion"
  | "material"
  | "asset"
  | "kostenprognose"
  | "aktivitaet"
  | "entscheidung"

export type SearchDomain = ProjectPhase | "controlling"

export interface ProjectSearchEntry {
  id: string
  kind: SearchEntityKind
  title: string
  domain: SearchDomain
  domainLabel: string
  snippet: string
  href: string
  searchText: string
}

export interface ProjectSearchIndex {
  entries: ProjectSearchEntry[]
}

const kindLabels: Record<SearchEntityKind, string> = {
  konflikt: "Conflict",
  planversion: "Plan version",
  material: "Material",
  asset: "Asset",
  kostenprognose: "Cost forecast",
  aktivitaet: "Activity",
  entscheidung: "Decision",
}

const domainLabels: Record<SearchDomain, string> = {
  planung: "Planning",
  bau: "Construction",
  betrieb: "Operations",
  controlling: "Controlling",
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
}

function createEntry(
  entry: Omit<ProjectSearchEntry, "searchText"> & { extraTerms?: string[] }
): ProjectSearchEntry {
  const terms = [
    entry.title,
    entry.snippet,
    entry.domainLabel,
    kindLabels[entry.kind],
    ...(entry.extraTerms ?? []),
  ]

  return {
    ...entry,
    searchText: normalizeSearchText(terms.join(" ")),
  }
}

function resolveActivityDomain(
  quelle: ProjectDashboardData["aktivitaeten"][number]["quelle"],
  ziel?: ProjectPhase
): { domain: SearchDomain; domainLabel: string } {
  if (ziel) {
    return { domain: ziel, domainLabel: domainLabels[ziel] }
  }

  if (quelle === "planung" || quelle === "bau" || quelle === "betrieb") {
    return { domain: quelle, domainLabel: domainLabels[quelle] }
  }

  return { domain: "controlling", domainLabel: domainLabels.controlling }
}

function routeForKind(kind: SearchEntityKind): string {
  switch (kind) {
    case "konflikt":
      return "/risiken"
    case "planversion":
    case "entscheidung":
      return "/planung"
    case "material":
      return "/bau"
    case "asset":
      return "/betrieb"
    case "kostenprognose":
      return "/kostenprognosen"
    case "aktivitaet":
      return "/aktivitaeten"
  }
}

export function buildProjectSearchIndex(
  data: ProjectDashboardData
): ProjectSearchIndex {
  const planstandById = new Map(
    data.planstaende.map((planstand) => [planstand.id, planstand])
  )
  const konfliktById = new Map(
    data.konflikte.map((konflikt) => [konflikt.id, konflikt])
  )

  const entries: ProjectSearchEntry[] = []

  for (const planversion of data.planversionen) {
    const planstand = planstandById.get(planversion.planstandId)
    entries.push(
      createEntry({
        id: planversion.id,
        kind: "planversion",
        title: planversion.version,
        domain: "planung",
        domainLabel: domainLabels.planung,
        snippet: planstand
          ? `${planstand.titel} · ${planversion.aenderungsnotiz}`
          : planversion.aenderungsnotiz,
        href: routeForKind("planversion"),
        extraTerms: [
          planversion.status,
          planversion.veroeffentlichtVon,
          planstand?.fachbereich ?? "",
        ],
      })
    )
  }

  for (const konflikt of data.konflikte) {
    entries.push(
      createEntry({
        id: konflikt.id,
        kind: "konflikt",
        title: konflikt.titel,
        domain: konflikt.zielDomaene,
        domainLabel: domainLabels[konflikt.zielDomaene],
        snippet: `${konflikt.beschreibung} · ${konflikt.prioritaet} · ${konflikt.status}`,
        href: routeForKind("konflikt"),
        extraTerms: [
          konflikt.quelle,
          konflikt.verantwortlich,
          konflikt.faelligAm ?? "",
        ],
      })
    )
  }

  for (const material of data.materialien) {
    entries.push(
      createEntry({
        id: material.id,
        kind: "material",
        title: material.name,
        domain: "bau",
        domainLabel: domainLabels.bau,
        snippet: `Status ${material.status} · ${material.geliefert}/${material.bestellt} ${material.einheit} delivered`,
        href: routeForKind("material"),
        extraTerms: [material.status, material.einheit],
      })
    )
  }

  for (const asset of data.assets) {
    entries.push(
      createEntry({
        id: asset.id,
        kind: "asset",
        title: asset.name,
        domain: "betrieb",
        domainLabel: domainLabels.betrieb,
        snippet: `${asset.standortBeschreibung} · ${asset.herkunft}`,
        href: routeForKind("asset"),
        extraTerms: [asset.status, ...asset.offenePunkte],
      })
    )
  }

  for (const prognose of data.kostenprognosen) {
    const konfliktTitel = prognose.konfliktId
      ? konfliktById.get(prognose.konfliktId)?.titel
      : undefined

    entries.push(
      createEntry({
        id: prognose.id,
        kind: "kostenprognose",
        title: konfliktTitel
          ? `Extra costs: ${konfliktTitel}`
          : `Cost forecast ${formatEuroFromCent(prognose.gesamtMehrkostenCent)}`,
        domain: "controlling",
        domainLabel: domainLabels.controlling,
        snippet: `${formatEuroFromCent(prognose.gesamtMehrkostenCent)} extra costs · ${prognose.zeitwirkungTage} days schedule impact · confidence ${prognose.konfidenz}`,
        href: routeForKind("kostenprognose"),
        extraTerms: prognose.annahmen,
      })
    )
  }

  for (const aktivitaet of data.aktivitaeten) {
    const { domain, domainLabel } = resolveActivityDomain(
      aktivitaet.quelle,
      aktivitaet.ziel
    )

    entries.push(
      createEntry({
        id: aktivitaet.id,
        kind: "aktivitaet",
        title: aktivitaet.titel,
        domain,
        domainLabel,
        snippet: `${aktivitaet.beschreibung} · ${aktivitaet.art}`,
        href: routeForKind("aktivitaet"),
        extraTerms: [aktivitaet.art, aktivitaet.quelle, aktivitaet.ziel ?? ""],
      })
    )
  }

  for (const entscheidung of data.entscheidungen) {
    const konfliktTitel = konfliktById.get(entscheidung.konfliktId)?.titel

    entries.push(
      createEntry({
        id: entscheidung.id,
        kind: "entscheidung",
        title: entscheidung.titel,
        domain: "planung",
        domainLabel: domainLabels.planung,
        snippet: konfliktTitel
          ? `${entscheidung.begruendung} · Conflict: ${konfliktTitel}`
          : entscheidung.begruendung,
        href: routeForKind("entscheidung"),
        extraTerms: [entscheidung.status, ...entscheidung.folgenFuerBetrieb],
      })
    )
  }

  return { entries }
}

export function searchProjectIndex(
  index: ProjectSearchIndex,
  query: string,
  limit = 12
): ProjectSearchEntry[] {
  const normalizedQuery = normalizeSearchText(query.trim())

  if (!normalizedQuery) {
    return index.entries.slice(0, limit)
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)

  const scored = index.entries
    .map((entry) => {
      let score = 0

      for (const token of tokens) {
        if (normalizeSearchText(entry.title).includes(token)) {
          score += 4
        }
        if (entry.searchText.includes(token)) {
          score += 2
        }
      }

      return { entry, score }
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)

  return scored.slice(0, limit).map((item) => item.entry)
}

export function getSearchKindLabel(kind: SearchEntityKind) {
  return kindLabels[kind]
}
