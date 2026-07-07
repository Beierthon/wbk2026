# WBK 2026 – Dokumentation

Deutsche Produkt- und Architektur-Dokumentation nach [Geistdocs](https://vercel.com/geist/introducing-geist-docs)-Prinzipien: klare Navigation, fachliche Kapitel, Mermaid-Diagramme und Verweise auf den Quellcode — **ohne** zusätzliches Docs-Framework im Repo.

> Geplant für einen späteren Ausbau: Geistdocs/Fumadocs, Volltextsuche und `llms.txt`. Bis die Struktur bestätigt ist, bleiben alle Inhalte reines Markdown in `docs/`.

## Navigation

| Kapitel | Datei | Inhalt |
| --- | --- | --- |
| **Überblick** | [produkt/ueberblick.md](./produkt/ueberblick.md) | Pitch, Zielgruppen, Nutzenversprechen ([#1](https://github.com/Beierthon/wbk2026/issues/1)) |
| **Demo-Story** | [produkt/demo-story.md](./produkt/demo-story.md) | Planung → Bau → Betrieb als Sequenz ([#1](https://github.com/Beierthon/wbk2026/issues/1), [#2](https://github.com/Beierthon/wbk2026/issues/2)) |
| **Architektur** | [architektur/README.md](./architektur/README.md) | Gesamtarchitektur, API Wrapper, Analytics ([#42](https://github.com/Beierthon/wbk2026/issues/42)) |
| **Supabase** | [technik/supabase.md](./technik/supabase.md) | Setup, Migrationen, Realtime ([#5](https://github.com/Beierthon/wbk2026/issues/5)) |
| **Datenmodell** | [technik/datenmodell.md](./technik/datenmodell.md) | Fachliche Entitäten und Beziehungen ([#7](https://github.com/Beierthon/wbk2026/issues/7)) |
| **ERP/EAP** | [technik/erp-eap.md](./technik/erp-eap.md) | Adapter, Sync, Import/Export ([#8](https://github.com/Beierthon/wbk2026/issues/8)) |
| **Designsystem** | [designsystem/README.md](./designsystem/README.md) | Geist/Vercel-UI, Tokens, shadcn ([#14](https://github.com/Beierthon/wbk2026/issues/14)) |
| **Betrieb** | [betrieb/README.md](./betrieb/README.md) | Deployment, Supabase-Zugriff, Sicherheit ([#30](https://github.com/Beierthon/wbk2026/issues/30)) |

## Weitere Referenzen (bestehend)

| Thema | Datei |
| --- | --- |
| Entwickler-Setup | [entwicklung.md](./entwicklung.md) |
| Demo-Daten & Seed | [demo-data.md](./demo-data.md) |
| Vision-Demo (Kamera/Mock) | [vision-demo.md](./vision-demo.md) |
| Kamera-Funktion (fachlich) | [funktionen/vision.md](./funktionen/vision.md) |
| Demo-Onboarding & Showcases | [#44](https://github.com/Beierthon/wbk2026/issues/44) – [#48](https://github.com/Beierthon/wbk2026/issues/48) |

## Content-Plan (MDX-Vorbereitung)

Jedes Kapitel erhält später optionales Frontmatter für einen Docs-Site-Generator:

```yaml
---
title: Demo-Story
description: Planung, Bau und Betrieb in einem durchgängigen Ablauf
order: 2
tags: [produkt, demo, pitch]
---
```

Geplante Bausteine pro Kapitel:

- **Mermaid** — Sequenz-, Flow- und ER-Diagramme (GitHub-kompatibel, siehe [architecture.md](./architecture.md))
- **Codebeispiele** — Env-Variablen, API-Verträge, CLI-Befehle
- **Issue-Verknüpfung** — Epics und technische Issues als Quelle der Wahrheit

## Technische Kapitel ↔ Issues

| Kapitel | Issue | Detaildokument |
| --- | --- | --- |
| Supabase | [#5](https://github.com/Beierthon/wbk2026/issues/5) | [supabase.md](./supabase.md) |
| Datenmodell | [#7](https://github.com/Beierthon/wbk2026/issues/7) | [data-model.md](./data-model.md) |
| ERP/EAP | [#8](https://github.com/Beierthon/wbk2026/issues/8) | [erp-adapter.md](./erp-adapter.md) |
| Designsystem | [#14](https://github.com/Beierthon/wbk2026/issues/14) | Kapitel-Stub + Brand [#40](https://github.com/Beierthon/wbk2026/issues/40) |

## Spätere Erweiterungen (nicht im Scope von #16)

- Geistdocs oder Fumadocs als statische Docs-Site
- Volltextsuche und Sidebar-Navigation
- `llms.txt` für Agenten und IDE-Integration
- GitHub-Edit-/Feedback-Flow („Edit on GitHub“-Links)

## Schnellstart für Leser

1. [Überblick](./produkt/ueberblick.md) — Was ist WBK 2026?
2. [Demo-Story](./produkt/demo-story.md) — Konflikt von Planung bis Betreiber
3. [Architektur](./architektur/README.md) — Wie hängt die Plattform zusammen?
4. [entwicklung.md](./entwicklung.md) — Repo lokal starten
