---
title: Datenmodell
description: Gemeinsame fachliche Entitäten für Planung, Bau und Betrieb
order: 5
tags: [technik, daten]
---

# Datenmodell

Das fachliche Datenmodell ist die gemeinsame Sprache aller Domänen. Es ist auf Deutsch beschrieben und parallel als TypeScript-Vertrag in `@workspace/domain` gepflegt.

## Vollständige Dokumentation

→ **[data-model.md](../data-model.md)** — Entitätentabelle, ER-Diagramm, Ableitung für Supabase

## Kernentitäten

| Entität | Zweck |
| --- | --- |
| Bauprojekt, Standort | Projektklammer und Baugrundkontext |
| Planstand, Planversion | Versionierte Planbasis |
| Konflikt, Kommentar, Entscheidung | Abweichungen und Nachvollziehbarkeit |
| Material, Bestellung | Bau-Dashboard und Kostenprognose |
| Asset | Betreiberübergabe |
| Aktivität | Timeline / Audit Trail |
| Externe Referenz | ERP/EAP-Mapping |
| Kostenprognose | Analytics und Risiko |

## Issue-Tracker

- [#7 – Datenmodell definieren](https://github.com/Beierthon/wbk2026/issues/7)
- [#17 – Demo-Daten mit Konflikt und Material](https://github.com/Beierthon/wbk2026/issues/17)

## Code-Verweise

- `packages/domain/` — TypeScript-Typen und Commands
- `supabase/migrations/` — Postgres-Schema
