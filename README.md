# WBK 2026

WBK 2026 ist eine Plattform fuer deutsche Bau- und Anlagenprojekte. Sie verbindet Planung, Bauausfuehrung und Betrieb in einem gemeinsamen Projektkontext: Planstaende, Baustellenfeedback, Materialdaten, Kostenprognosen, ERP/EAP-Informationen, Betreiberuebergabe und spaetere Wartung gehoeren in eine nachvollziehbare Projektgeschichte.

## Produktziel

Die Plattform beantwortet zentrale Projektfragen:

- Wie viel Material wurde geplant, bestellt, geliefert, verbaut, verloren oder nachgekauft?
- Wie weit ist der Projektfortschritt gegenueber Plan und Zeitachse?
- Stimmt die initiale Kalkulation noch?
- Welche Konflikte zwischen Baustelle, Planung und Betrieb muessen entschieden werden?
- Welche Informationen muessen Betreiber spaeter fuer Wartung, Assets und Nachweise uebernehmen?

## Architektur

Die aktuelle Zielarchitektur, inklusive Vision Processing, Supabase, ERP/EAP, Mock-API-Wrapper und Analytics, ist hier dokumentiert:

- [Architecture & Mermaid Flows](./docs/architecture.md)
- [Fachliches Datenmodell](./docs/data-model.md)
- [Demo-Daten](./docs/demo-data.md)
- [API Wrapper](./docs/api-wrapper.md)

## Entwicklung

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

Hinweis: Die UI soll zuerst mit Mock-Daten ueber eine API-/Repository-Schicht arbeiten. Supabase wird spaeter ueber denselben Vertrag angebunden, damit Dashboard-Komponenten nicht direkt an Backend-Details gekoppelt sind.

## Designrichtung

- Geist Sans/Mono als praezise Dashboard-Typografie.
- Vercel-inspirierte, ruhige und dichte Projektoberflaeche.
- shadcn/ui-Komponenten aus dem Workspace wiederverwenden.
- Erste Ansicht ist ein operatives Projekt-Cockpit, keine Marketing-Landingpage.
