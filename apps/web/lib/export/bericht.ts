import type { ProjectDashboardData } from "@/lib/data/types"

function euro(cent: number): string {
  return `${(cent / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}

/**
 * Builds a structured project report as Markdown (#27): planning, construction
 * conflicts, cost forecasts, and operator handover.
 */
export function buildProjektbericht(data: ProjectDashboardData): string {
  const lines: string[] = []

  lines.push(`# Project report: ${data.projekt.name}`)
  lines.push("")
  lines.push(`- Site: ${data.standort.name}, ${data.standort.adresse}`)
  lines.push(`- Phase: ${data.projekt.phase} · Status: ${data.projekt.status}`)
  lines.push(`- Budget: ${euro(data.projekt.budgetCent)}`)
  lines.push(`- Project lead: ${data.projekt.projektleitung}`)
  lines.push("")

  lines.push("## Planning")
  for (const planstand of data.planstaende) {
    const version = data.planversionen.find(
      (item) => item.id === planstand.aktuelleVersionId
    )
    lines.push(
      `- ${planstand.titel} (${planstand.fachbereich}): current version ${
        version?.version ?? "—"
      } · status ${version?.status ?? "—"}`
    )
  }
  lines.push("")

  lines.push("## Construction conflicts")
  for (const konflikt of data.konflikte) {
    lines.push(
      `- **${konflikt.titel}** — ${konflikt.status}, priority ${konflikt.prioritaet}`
    )
    lines.push(`  - ${konflikt.beschreibung}`)
    if (konflikt.kostenwirkungCent) {
      lines.push(`  - Cost impact: ${euro(konflikt.kostenwirkungCent)}`)
    }
  }
  lines.push("")

  lines.push("## Cost forecasts")
  for (const prognose of data.kostenprognosen) {
    lines.push(
      `- Total ${euro(prognose.gesamtMehrkostenCent)} · ${
        prognose.zeitwirkungTage
      } days · confidence ${prognose.konfidenz}`
    )
  }
  lines.push("")

  lines.push("## Operator handover")
  for (const asset of data.assets) {
    lines.push(`- ${asset.name} (${asset.status}) — ${asset.herkunft}`)
    for (const punkt of asset.offenePunkte) {
      lines.push(`  - Open: ${punkt}`)
    }
  }
  lines.push("")

  lines.push("## Decisions")
  for (const entscheidung of data.entscheidungen) {
    lines.push(`- ${entscheidung.titel} (${entscheidung.status})`)
    lines.push(`  - ${entscheidung.begruendung}`)
  }
  lines.push("")

  return lines.join("\n")
}
