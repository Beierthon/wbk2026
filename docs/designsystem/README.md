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

## Geplante Kapitel-Inhalte (#14)

- Farb- und Spacing-Tokens (CSS-Variablen)
- Typografie-Skala (Geist)
- Dashboard-Layout-Muster (Sidebar, KPI-Karten, Tabellen)
- Dark/Light-Mode (siehe Sidebar-Theme-Issues)
