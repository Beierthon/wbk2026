---
title: ERP/EAP
description: Externe Material-, Bestell- und Betriebsdaten im Dashboard
order: 6
tags: [technik, integration]
---

# ERP/EAP-Integration

Externe ERP- und EAP-Systeme liefern Materialbestand, Bestellungen, Kostenstellen und Asset-IDs. Die Demo läuft ohne echte Zugangsdaten über Mock-Adapter und importierbare Beispieldaten.

## Vollständige Dokumentation

→ **[erp-adapter.md](../erp-adapter.md)** — Vertrag, Sync-Status, API, UI-Einordnung

## Datenherkunft im UI

Werte werden kenntlich gemacht, ob sie aus der Plattform oder einem externen System stammen (`ExterneReferenz`, Sync-Status).

## Import / Export

- CSV- und JSON-Import für Demo-Material ([#27](https://github.com/Beierthon/wbk2026/issues/27))
- Projektbericht-Export als CSV

Siehe auch [demo-data.md](../demo-data.md) für das Demo-Projekt.

## Issue-Tracker

| Issue | Thema |
| --- | --- |
| [#8](https://github.com/Beierthon/wbk2026/issues/8) | Integrationspunkte definieren |
| [#21](https://github.com/Beierthon/wbk2026/issues/21) | Mock-fähiger Adapter |
| [#66](https://github.com/Beierthon/wbk2026/issues/66) | Vision-Scan → ERP/EAP-Update |

## API-Schnellreferenz

```bash
GET /api/projects/:projectId/erp-sync
POST /api/projects/:projectId/import/erp
```
