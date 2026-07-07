# Demo-Daten

Die Demo-Daten liegen typisiert in `@workspace/domain/demo-data` und werden in Supabase ueber `supabase/seed.sql` gespiegelt.

## Quelle in der App

| Modus                 | Quelle                        | Wann                                          |
| --------------------- | ----------------------------- | --------------------------------------------- |
| `supabase` (Standard) | Postgres via Repository       | `NEXT_PUBLIC_SUPABASE_*` gesetzt              |
| `mock`                | `@workspace/domain/demo-data` | `WBK_DATA_SOURCE=mock` oder ohne Supabase-Env |

Setup: `pnpm setup` (link, migrate, seed) oder `pnpm demo:seed` — siehe [entwicklung.md](./entwicklung.md) und [supabase.md](./supabase.md).

## Szenario

Das Projekt `Neubau Betriebs- und Lernzentrum Campus West` zeigt den Kernfluss Planung -> Bau -> Betrieb:

1. Die Planung veroeffentlicht Planversion `TWP-GRU-1.0` fuer Gruendung und Bodenplatte.
2. Die Baustelle findet im Suedfeld eine feuchte Auffuellschicht, die im Plan nicht beruecksichtigt ist.
3. Das Bau-Team meldet einen Konflikt mit Kommentar, Standortbezug und erwarteter Kosten-/Zeitwirkung.
4. Die Planung erstellt Planversion `TWP-GRU-1.1` mit Drainagevlies und zusaetzlicher Sauberkeitsschicht.
5. Material, ERP-Bestellung und Kostenprognose werden aktualisiert.
6. Der Drainageaufbau wird als Asset fuer die Betreiberakte und Wartung vorgemerkt.

## Abdeckung

- #3 Planung: Planstand, zwei Planversionen, Konflikt und Planungsantwort.
- #4 Bau: Materialstatus, Bestellung, Baukommentar und Konfliktmeldung.
- #6 Betrieb: Asset mit Herkunft, Wartungsintervall und offenen Uebergabepunkten.
- #9 Aktivitaetslog: Planfreigabe, Konflikt, Prognose und Asset-Uebergabe.
- #10 Standort/Baugrund: Standort mit Baugrund- und Umfeldhinweisen.
- #12 Kostenprognosen: Material-, Arbeits-, Bauzeit- und Betriebsmehrkosten.
- #36 Maschinen-/Anlagenbau: Montagezelle MZ-02 mit Stuecklistenmaterial, ERP-Serien-ID, Ersatzteilreferenz und Wartungsaufgabe.
- #76 Vision-Demo: Mock-Erkennung fuer Kamera-Scan im Bau-Dashboard (siehe [vision-demo.md](./vision-demo.md)).

## Verwendung

```ts
import { WBK_DEMO_DATA, getDemoProjectData } from "@workspace/domain/demo-data"
```

Die Datenstruktur erfuellt `BauprojektDatenmodell` und kann spaeter in Supabase-Seeds oder Mock-Adapter ueberfuehrt werden.
