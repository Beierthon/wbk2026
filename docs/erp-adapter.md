# ERP/EAP Adapter

Der ERP/EAP-Adapter kapselt externe Material-, Bestell-, Kostenstellen- und Asset-Daten hinter einer einheitlichen Schnittstelle. Die Demo laeuft ohne echte Zugangsdaten ueber einen Mock-Adapter, der aus dem Projekt-Repository ableitet.

## Vertrag

```ts
import { getErpSyncSnapshot } from "@/lib/erp"

const snapshot = await getErpSyncSnapshot(projectId)
```

`ErpSyncSnapshot` enthaelt:

- `adapter`: `mock` oder `supabase` (gleiche Quelle wie `WBK_DATA_SOURCE`)
- `systeme`: Zusammenfassung je ERP/EAP-System mit letztem Sync-Zeitpunkt
- `datensaetze`: Einzelne Mapping-Eintraege mit externer ID, interner Referenz und Sync-Status
- `zusammenfassung`: Anzahl je Status

## Sync-Status

| Status | Bedeutung |
| --- | --- |
| `synchronisiert` | Letzter Abgleich innerhalb von 6 Stunden |
| `veraltet` | Abgleich aelter als 6 Stunden, aber vorhanden |
| `nicht_synchronisiert` | Kein `synchronisiertAm` gesetzt |
| `manuell_ueberschrieben` | Baustellenstand weicht vom ERP-Import ab |
| `importiert` | Initial importierte Stammdaten |

## Objekttypen

Material, Bestellungen, Kostenstellen, Assets, Wartung und Leistungswerte werden auf `ExterneReferenz` bzw. abgeleitete Demo-Mappings gemappt.

## API

`GET /api/projects/:projectId/erp-sync` liefert denselben Snapshot wie `getErpSyncSnapshot()`.

## UI

- Bau-Dashboard (#4): Material und Bestellungen
- Betreiber-Dashboard (#6): EAP-Assets und Uebergabe
- Kostenprognosen (#12): Kostenstellen und Leistungswerte

Die Komponente `ErpSyncPanel` zeigt Adapter-Quelle, Systemstatus und die Mapping-Tabelle.

## Erweiterung

Fuer echte ERP/EAP-Anbindungen implementiert ein neuer Adapter dasselbe `ErpAdapter`-Interface in `apps/web/lib/erp/types.ts` und ersetzt die Snapshot-Erzeugung in `getErpAdapter()`.
