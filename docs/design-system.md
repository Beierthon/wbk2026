# Designsystem

Issue #14 definiert ein kompaktes Dashboard-Fundament fuer WBK 2026. Die App
nutzt Geist Sans fuer UI-Text und Geist Mono fuer Zahlen, IDs, Zeitpunkte,
Planversionen und technische Metadaten.

## Tokens

Die globalen Tokens liegen in `packages/ui/src/styles/globals.css`.

- Schrift: `--font-sans`, `--font-mono`, `--font-heading`
- Radius: `--radius`, `--radius-sm`, `--radius-md`, `--radius-lg`
- Dichte: `--density-xs`, `--density-sm`, `--density-md`
- Tabellen: `--table-row-height`, `--table-cell-padding-x`, `--table-cell-padding-y`
- Statusfarben: `--status-risk`, `--status-cost`, `--status-planning`, `--status-construction`, `--status-operations`

## Dashboard-Bausteine

Die Beispielkomponenten liegen in
`apps/web/components/dashboard/design-system-examples.tsx` und werden im
Projekt-Cockpit gerendert.

- KPI-Karte: kompakte Kennzahl mit fachlichem Status.
- Materialtabelle: scannbare Tabellenstruktur mit Mono-Zahlen.
- Aktivitaetslog: chronologische Ereignisse mit Zeitstempeln.
- Konfliktkarte: Status, Prioritaet, Verantwortlichkeit und lange Beschreibung.
- Kostenprognose: Forecast-Betrag, Konfidenz und Annahmen.

## Responsive Regeln

Deutschsprachige Langbegriffe werden in Cards, Tabellen und Logs mit
`break-words`, `whitespace-normal` und begrenzten Spaltenbreiten behandelt.
Die erste Ansicht bleibt das operative Projekt-Cockpit; keine Marketing-Heroes.

## Verknuepfte Produktflaechen

- Plattform-Epic: #2
- Dashboard-Cockpit: #3
- Bau-/Planungsdashboard: #4
- Betreiber-/Analyticsflaechen: #6
