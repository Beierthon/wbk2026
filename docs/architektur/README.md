---
title: Architektur
description: Gesamtarchitektur, Schichtenmodell und technische Flüsse
order: 3
tags: [architektur, technik]
---

# Architektur

WBK 2026 ist eine **Next.js**-App mit Repository-Schicht, Mock- und Supabase-Adapter, ERP/EAP-Integration, Analytics-Engines und Vercel AI Gateway für Vision Processing.

## Detaildokumente

| Thema | Datei | Inhalt |
| --- | --- | --- |
| Gesamtarchitektur & Mermaid | [architecture.md](../architecture.md) | Flowcharts, Domain Workflow, Analytics |
| API Wrapper | [api-wrapper.md](../api-wrapper.md) | Mock zuerst, Supabase-Adapter, einheitlicher Vertrag |
| Fachliches Datenmodell | [data-model.md](../data-model.md) | Entitäten, ER-Diagramm ([#7](https://github.com/Beierthon/wbk2026/issues/7)) |
| Vision Processing | [vision-demo.md](../vision-demo.md) | Kamera-Mock, API-Vertrag |

## Schichtenmodell (Kurz)

```
Dashboard UI (shadcn/ui)
    ↓
Repository Interface (lib/data)
    ↓
├── Mock Adapter (WBK_DATA_SOURCE=mock)
├── Supabase Adapter (Postgres, Storage, Realtime)
└── ERP/EAP Adapter (externe Referenzen)
```

## Verwandte Issues

- [#2 – Epic: Einheitliche Plattform](https://github.com/Beierthon/wbk2026/issues/2)
- [#34 – API Wrapper](https://github.com/Beierthon/wbk2026/issues/34)
- [#42 – Mermaid-Diagramme](https://github.com/Beierthon/wbk2026/issues/42)

## Nächste Kapitel

- [Supabase](../technik/supabase.md)
- [Datenmodell](../technik/datenmodell.md)
- [ERP/EAP](../technik/erp-eap.md)
