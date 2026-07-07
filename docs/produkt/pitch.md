# WBK 2026 – Pitch

## Kernbotschaft

WBK 2026 zeigt nicht nur getrennte Dashboards, sondern den **durchgängigen
Lebenszyklus eines realen Bauprojekts**: Planer liefern Planstände, Bau-Teams
melden Konflikte und Fortschritt zurück, Betreiber übernehmen die vollständige
Historie für Wartung, Assets und Entscheidungen.

## Problem

Planung, Bauausführung und Betrieb arbeiten heute in getrennten Werkzeugen.
Konflikte aus der Realität (z. B. abweichender Baugrund) erreichen die Planung
zu spät, Materialschwund und Nachkauf bleiben unsichtbar, und Betreiber
übernehmen ein Bauwerk ohne nachvollziehbare Entscheidungshistorie.

## Zielgruppen

- **Planung** – Architektur, Tragwerk, TGA, Brandschutz
- **Bau** – Bauleitung, ausführende Teams, Einkauf
- **Betrieb** – Betreiber, Facility Management, Wartung

## Nutzenversprechen

- Eine gemeinsame Projektwahrheit über alle Phasen.
- Konflikte, Kosten- und Zeitwirkung sowie Entscheidungen sind jederzeit
  nachvollziehbar (Audit Trail).
- Material- und Kostenwahrheit: geplant, verbaut, Schwund, Nachkauf, Prognose.
- Reale Baustellenlage per Kamera-Scan, bestätigt ins System übernommen.

## Demo-Szenario (Beispielkonflikt)

1. Planer veröffentlicht die initiale Gründungsplanung.
2. Das Bau-Team stellt fest, dass die Bodenverhältnisse nicht berücksichtigt
   wurden, und meldet den Konflikt zurück.
3. Kommentar, Risikobewertung und Kostenprognose entstehen.
4. Die Planung passt den Planstand an und veröffentlicht eine neue Version.
5. Kosten- und Zeitplanwirkung werden sichtbar.
6. Der Betreiber sieht später Entscheidung, Ursache und Wartungsfolge.

Der komplette Ablauf ist als geführte Tour unter `/demo` erlebbar.

## Technische Säulen

- **Next.js + shadcn/ui** – ruhiges, dichtes Dashboard (Geist Sans/Mono).
- **Repository-Schicht** – Mock-Daten zuerst, Supabase-Adapter identisch
  (Schreib-Flows über `applyMutation`, Realtime vorbereitet).
- **Analytics- und Kalkulations-Engines** – Schwundquote, Kostenprognose,
  Kalkulations-Baseline (deterministisch, unit-getestet).
- **Vision** – Kamera-Scan mit Bestätigung vor System-Update, Demo-Modus ohne
  Kamera, Datenschutz-Verpixelung.
- **ERP/EAP-Adapter** – externe Material- und Betriebsdaten mit Herkunftskennung.
