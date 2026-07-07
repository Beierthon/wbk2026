import type { ProjectDashboardData } from "@/lib/data/types"

function euro(cent: number): string {
  return `${(cent / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}

/**
 * Baut einen strukturierten Projektbericht als Markdown (#27): Planung,
 * Baukonflikte, Kostenprognosen und Betreiberübergabe.
 */
export function buildProjektbericht(data: ProjectDashboardData): string {
  const lines: string[] = []

  lines.push(`# Projektbericht: ${data.projekt.name}`)
  lines.push("")
  lines.push(`- Standort: ${data.standort.name}, ${data.standort.adresse}`)
  lines.push(`- Phase: ${data.projekt.phase} · Status: ${data.projekt.status}`)
  lines.push(`- Budget: ${euro(data.projekt.budgetCent)}`)
  lines.push(`- Projektleitung: ${data.projekt.projektleitung}`)
  lines.push("")

  lines.push("## Planung")
  for (const planstand of data.planstaende) {
    const version = data.planversionen.find(
      (item) => item.id === planstand.aktuelleVersionId
    )
    lines.push(
      `- ${planstand.titel} (${planstand.fachbereich}): aktuelle Version ${
        version?.version ?? "—"
      } · Status ${version?.status ?? "—"}`
    )
  }
  lines.push("")

  lines.push("## Baukonflikte")
  for (const konflikt of data.konflikte) {
    lines.push(
      `- **${konflikt.titel}** — ${konflikt.status}, Priorität ${konflikt.prioritaet}`
    )
    lines.push(`  - ${konflikt.beschreibung}`)
    if (konflikt.kostenwirkungCent) {
      lines.push(`  - Kostenwirkung: ${euro(konflikt.kostenwirkungCent)}`)
    }
  }
  lines.push("")

  lines.push("## Kostenprognosen")
  for (const prognose of data.kostenprognosen) {
    lines.push(
      `- Gesamt ${euro(prognose.gesamtMehrkostenCent)} · ${
        prognose.zeitwirkungTage
      } Tage · Konfidenz ${prognose.konfidenz}`
    )
  }
  lines.push("")

  lines.push("## Betreiberübergabe")
  for (const asset of data.assets) {
    lines.push(
      `- ${asset.name} (${asset.status}) — ${asset.herkunft}`
    )
    for (const punkt of asset.offenePunkte) {
      lines.push(`  - Offen: ${punkt}`)
    }
  }
  lines.push("")

  lines.push("## Entscheidungen")
  for (const entscheidung of data.entscheidungen) {
    lines.push(`- ${entscheidung.titel} (${entscheidung.status})`)
    lines.push(`  - ${entscheidung.begruendung}`)
  }
  lines.push("")

  return lines.join("\n")
}
