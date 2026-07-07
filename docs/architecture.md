# Architecture & Mermaid Flows

Diese Datei sammelt die wichtigsten Architektur- und Produktfluesse fuer WBK 2026. Die Diagramme sind bewusst GitHub-kompatibel gehalten, damit sie direkt in Issues, PRs und spaeteren Docs wiederverwendet werden koennen.

## Gesamtarchitektur

```mermaid
flowchart TD
  A["Next.js App auf Vercel"] --> B["API Wrapper / Repository Layer"]

  B --> C{"Datenquelle"}
  C -->|Demo-Modus| D["Mock-Daten"]
  C -->|Produktion| E["Supabase"]

  E --> E1["Postgres"]
  E --> E2["Storage"]
  E --> E3["Realtime"]
  E --> E4["RLS / Data API Grants"]

  B --> F["ERP/EAP Adapter"]
  F --> F1["Materialbestand"]
  F --> F2["Bestellungen"]
  F --> F3["Kostenstellen"]
  F --> F4["Asset-IDs"]

  B --> G["Vercel AI Gateway / AI SDK"]
  G --> G1["Vision Processing"]
  G --> G2["Strukturierte Analyse"]
  G --> G3["Forecast Assistenz"]

  B --> H["Domain Services"]
  H --> H1["Planung"]
  H --> H2["Bauausfuehrung"]
  H --> H3["Betrieb"]
  H --> H4["Kostenprognosen"]
  H --> H5["Materialanalyse"]

  H --> I["Dashboard UI"]
  E3 --> I
  I --> J["Projekt-Cockpit"]
  I --> K["Planungs-Dashboard"]
  I --> L["Bau-Dashboard"]
  I --> M["Betreiber-Dashboard"]
  I --> N["Analytics-Cockpit"]
```

## Vision Processing: Kamera, Plan und CAD

```mermaid
flowchart TD
  A["Baustelle / Anlage"] --> B["Kameraaufnahme oder Upload"]
  B --> C["Next.js Upload UI"]
  C --> D["API Wrapper"]

  D --> E{"Datenmodus"}
  E -->|Demo| F["Mock Storage / Demo-Daten"]
  E -->|Produktion| G["Supabase Storage"]

  G --> H["Datei-Metadaten"]
  F --> H

  H --> I["Vision Processing Job"]
  I --> J["Vercel AI Gateway / AI SDK"]
  J --> K["Vision Model"]

  K --> L["Strukturierte Analyse"]
  L --> L1["Erkanntes Material"]
  L --> L2["Baufortschritt"]
  L --> L3["Abweichung zum Plan/CAD"]
  L --> L4["Risiko / Blocker"]
  L --> L5["Kosten- und Zeitplanwirkung"]

  L1 --> M["Materialanalyse"]
  L2 --> N["Analytics-Cockpit"]
  L3 --> O["Plan-/CAD-Abgleich"]
  L4 --> P["Risiko-Matrix"]
  L5 --> Q["Kostenprognose"]

  O --> R["Konflikt / Kommentar / Marker"]
  R --> S["Plan-Annotation"]
  R --> T["Aktivitaetslog"]

  M --> U["Supabase Postgres"]
  N --> U
  P --> U
  Q --> U
  T --> U

  U --> V["Supabase Realtime"]
  V --> W["Dashboard Updates"]
  W --> X["Planung"]
  W --> Y["Bau"]
  W --> Z["Betrieb"]

  Z --> AA["Audit Trail"]
  AA --> AB["Betreiberhistorie / Uebergabe"]
```

## API Wrapper: Mock-Daten zuerst, Supabase spaeter

```mermaid
flowchart LR
  A["UI-Komponenten"] --> B["Domain Hooks"]
  B --> C["Repository Interface"]

  C --> D{"Adapter"}
  D -->|Heute| E["Mock Adapter"]
  D -->|Spaeter| F["Supabase Adapter"]
  D -->|Integration| G["ERP/EAP Adapter"]

  E --> H["Demo-Daten"]
  F --> I["Supabase Client"]
  G --> J["Externe Projekt-/Kostendaten"]

  I --> K["Postgres"]
  I --> L["Storage"]
  I --> M["Realtime"]

  C --> N["Einheitliche Resultate"]
  N --> O["Loading / Error / Empty States"]
  N --> P["Dashboard UI"]
```

## Analytics: Material, Kalkulation und Zeitplan

```mermaid
flowchart TD
  A["Initiale Kalkulation / Baseline"] --> B["Analytics Engine"]
  C["Geplantes Material"] --> B
  D["Bestelltes Material"] --> B
  E["Geliefertes Material"] --> B
  F["Verbautes Material"] --> B
  G["Verloren / Gestohlen / Beschaedigt"] --> B
  H["Nachgekauftes Material"] --> B
  I["Arbeitszeit / Nacharbeit"] --> B
  J["Zeitplan / Meilensteine"] --> B
  K["ERP/EAP Werte"] --> B

  B --> L["Soll/Ist Material"]
  B --> M["Schwundquote"]
  B --> N["Kostenabweichung"]
  B --> O["Zeitplanabweichung"]
  B --> P["Forecast Konfidenz"]

  L --> Q["Analytics-Cockpit"]
  M --> Q
  N --> Q
  O --> Q
  P --> Q

  Q --> R["Planung"]
  Q --> S["Bauausfuehrung"]
  Q --> T["Betrieb"]
```

## Domain Workflow: Planung -> Bau -> Betrieb

```mermaid
sequenceDiagram
  participant Planung
  participant Bau
  participant Analytics
  participant Betrieb
  participant Supabase

  Planung->>Supabase: Planversion und Kalkulations-Baseline speichern
  Bau->>Supabase: Baustellenfeedback, Materialstatus und Konflikt melden
  Bau->>Analytics: Ist-Material, Verlust, Nachkauf und Arbeitszeit liefern
  Analytics->>Supabase: Kostenprognose und Risiko aktualisieren
  Supabase-->>Planung: Realtime-Hinweis zu Konflikt und Plananpassung
  Planung->>Supabase: Neue Planversion und Entscheidung dokumentieren
  Supabase-->>Betrieb: Audit Trail, Asset-Informationen und Uebergabehistorie
  Betrieb->>Supabase: Wartungsrelevanz und offene Betreiberpunkte markieren
```

## Offene Diagramm-Backlog-Ideen

- Supabase RLS/Data-API-Grenzen je Tabelle.
- Storage-Bucket-Flow fuer Planunterlagen, Fotos und Uebergabedokumente.
- ERP/EAP-Synchronisation mit Konfliktstatus.
- Vercel Preview Deployment Flow.
- Kostenprognose-Engine mit Annahmen, Versionierung und Audit Trail.
