---
title: Designsystem
description: Geist/Vercel-Dashboard-Grundlage, UI-Tokens und shadcn/ui
order: 7
tags: [design, ux]
---

# Designsystem

Die Oberfläche orientiert sich an **Vercel-Designprinzipien**: ruhiges, dichtes Projekt-Cockpit statt Marketing-Landingpage. Typografie mit **Geist Sans/Mono**, Komponenten aus **shadcn/ui** im Workspace.

## Issue-Tracker (UI-Kapitel)

| Issue | Thema |
| --- | --- |
| [#14 – Designsystem: Geist/Vercel-Dashboard-Grundlage und UI-Tokens](https://github.com/Beierthon/wbk2026/issues/14) | Tokens, Typografie, Dichte |
| [#15 – App-Shell: Operatives Projekt-Cockpit](https://github.com/Beierthon/wbk2026/issues/15) | Erste Ansicht, Navigation |
| [#40 – Brand Assets: Logo, Favicon, App-Icons](https://github.com/Beierthon/wbk2026/issues/40) | Markenidentität |
| [#102 – Unified Design system](https://github.com/Beierthon/wbk2026/issues/102) | Konsolidierung |

## Richtlinien (aus Produkt)

- Geist Sans/Mono als präzise Dashboard-Typografie
- Vercel-inspirierte, ruhige und dichte Projektoberfläche
- shadcn/ui-Komponenten aus `packages/ui` wiederverwenden
- Erste Ansicht = operatives Projekt-Cockpit, keine Landingpage

## Code-Verweise

- `packages/ui/` — gemeinsame UI-Komponenten
- `apps/web/app/` — App-Shell und Dashboard-Routen
- `components.json` — shadcn-Konfiguration

## UI-Tokens (`packages/ui/src/styles/globals.css`)

### Typografie

| Token | Verwendung |
| --- | --- |
| `--font-sans` / Geist Sans | Navigation, Tabellen, Formulare, Fließtext |
| `--font-mono` / Geist Mono | Projekt-IDs, Beträge, Zeitstempel, Planversionen, ERP-Schlüssel |
| `--font-heading` | Überschriften (alias `--font-sans`) |

### Radius und Dichte

| Token | Wert |
| --- | --- |
| `--radius` | `0.375rem` (Basis) |
| `--radius-sm` … `--radius-4xl` | Skalierte Ecken für Karten, Dialoge, Chips |

Dashboard-Layouts nutzen `gap-8` (Desktop) bzw. `gap-4` auf Baustellen-Ansichten für höhere Informationsdichte.

### Statusfarben

| Token | Light | Bedeutung |
| --- | --- | --- |
| `--status-signal` / `--wbk-signal` | `#d97706` | Aufmerksamkeit, offene Punkte |
| `--status-alert` / `--wbk-alert` | `#dc2626` | Kritisch, Engpass, Risiko |
| `--status-ok` / `--wbk-ok` | `#16a34a` | Im Soll, erledigt |

`StatStrip` und Badges verwenden diese Tokens über `tone`-Varianten (`signal`, `alert`, `ok`).

### Oberflächen (shadcn)

| Token | Rolle |
| --- | --- |
| `--background` / `--foreground` | Seitenhintergrund und Text |
| `--card` / `--card-foreground` | KPI-Karten, SectionCards |
| `--muted` / `--muted-foreground` | Sekundärtext, Tabellen-Hints |
| `--primary` | Primäre Aktionen, aktive Navigation |
| `--sidebar-*` | App-Shell-Sidebar (Inset-Variante) |
| `--chart-1` … `--chart-5` | Analytics-Diagramme |

Dark Mode setzt dieselben semantischen Rollen mit angepassten HSL-Werten unter `.dark`.

### Komponenten-Muster

- **KPI / StatStrip** — kompakte Kennzahlen mit optionalem Hint und Status-Ton
- **Tabellen** — `font-mono` für Mengen, Beträge und technische Felder
- **Aktivitätslog** — `ActivityKindBadge` + Zeitstempel in Mono
- **Konfliktkarten** — `ListRow` mit `tone` signal/alert
- **Kostenprognose** — Tabellen mit `formatEuroFromCent` (Mono)

## Geplante Kapitel-Inhalte (#14)

- Beispiel-Screens für KPI, Tabelle, Aktivitätslog, Konfliktkarte und Kostenprognose (siehe Dashboard-Routen)
- Mobile und Desktop: lange deutsche Begriffe in Sidebar und Tabellen mit `truncate` / `flex-wrap`
