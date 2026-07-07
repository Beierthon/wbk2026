# Vision-Demo: Kamera-Scan ohne echtes Modell

Die Kamera-/Vision-Funktion ist fuer Hackathon-Demos und lokale Entwicklung ohne echtes Vision-Modell, ohne ERP/EAP-Credentials und ohne Baustellenkamera nutzbar.

## Was laeuft im Mock-Modus?

- **Mock-Detector** (`WBK_VISION_MODE=mock`, Standard): stabile Beispielobjekte passend zu den Demo-Materialien im Bau-Dashboard.
- **ERP/EAP-Abgleich**: erkannte Positionen werden gegen die Materialdaten des Demo-Projekts `Campus West` gematcht (z. B. `Drainagevlies Klasse GRK 4`, `PO-2026-8842`).
- **Nutzerbestaetigung**: erst nach Klick auf „Update bestaetigen“ erscheint das Ergebnis im Dashboard.
- **Spaetere Live-Anbindung**: `WBK_VISION_MODE=live` ist vorbereitet, liefert aktuell aber `501 Not Implemented`.

## Schnelltest (lokal)

```bash
pnpm install
pnpm dev
```

1. Im Browser `http://localhost:3000/bau` oeffnen.
2. Im Bereich **Vision-Update fuer ERP/EAP** einen Modus waehlen:
   - **Kamera-Update starten** — echte Kamera (Handy oder Webcam)
   - **Demo-Scan ohne Kamera** — Desktop-Fallback mit festem Demo-Frame
   - **Bild hochladen** — eigenes Testbild als Frame
3. Bounding Boxes und Materialtreffer pruefen.
4. **Update bestaetigen** klicken, um das ERP/EAP-Update in der Demo zu sehen.

## Schnelltest (Handy)

1. Dev-Server im LAN erreichbar machen, z. B. `pnpm dev --hostname 0.0.0.0`.
2. Auf dem Handy die URL mit **HTTPS** oder **localhost** oeffnen (siehe unten).
3. **Kamera-Update starten** tippen und Kamerazugriff erlauben.
4. Rueckkamera wird bevorzugt (`facingMode: environment`).
5. Ergebnis pruefen und bestaetigen.

## HTTPS und Browser-Einschraenkungen

Die Browser-Kamera-API (`navigator.mediaDevices.getUserMedia`) funktioniert nur in **sicheren Kontexten**:

| Umgebung | Kamera verfuegbar? |
| --- | --- |
| `http://localhost` | Ja |
| `http://127.0.0.1` | Ja |
| `https://…` (Vercel Preview, Produktion) | Ja |
| `http://192.168.x.x` (LAN-IP ohne TLS) | **Nein** — Demo-Scan ohne Kamera oder Bild-Upload nutzen |

Bekannte Meldungen:

- **Berechtigung verweigert** — Kamera in den Browser-/OS-Einstellungen erlauben.
- **Keine Kamera gefunden** — Desktop ohne Webcam: „Demo-Scan ohne Kamera“ verwenden.
- **Nicht sicherer Kontext** — HTTPS oder localhost nutzen.

## Konfiguration

```env
WBK_DATA_SOURCE=mock
WBK_VISION_MODE=mock
```

| Variable | Werte | Beschreibung |
| --- | --- | --- |
| `WBK_DATA_SOURCE` | `mock` (Standard), `supabase` | Dashboard-Datenquelle |
| `WBK_VISION_MODE` | `mock` (Standard), `live` | Vision-Backend; `live` noch nicht angebunden |

## API-Vertrag

`POST /api/vision/inspect`

**Request:**

```json
{
  "image": "data:image/jpeg;base64,...",
  "expectedItems": [
    {
      "id": "material-drainagevlies",
      "name": "Drainagevlies Klasse GRK 4",
      "einheit": "m2",
      "geliefert": 300,
      "verbaut": 0,
      "verbleibend": 300,
      "externeReferenz": "PO-2026-8842"
    }
  ],
  "useStableMock": true
}
```

**Response (Auszug):**

```json
{
  "mode": "mock",
  "source": "mock-vision-stable-demo",
  "frameRate": 1,
  "summary": {
    "expected": 2,
    "detected": 2,
    "matched": 2,
    "needsConfirmation": true
  },
  "detections": [
    {
      "id": "vision-material-drainagevlies",
      "label": "Drainagevlies Klasse GRK 4",
      "confidence": 0.91,
      "box": { "x": 8, "y": 18, "width": 34, "height": 28 },
      "systemMatch": {
        "materialName": "Drainagevlies Klasse GRK 4",
        "externeReferenz": "PO-2026-8842"
      }
    }
  ]
}
```

Die Implementierung liegt in `@workspace/domain/vision` und kann spaeter durch einen echten Vision-Service ersetzt werden, ohne den UI-Vertrag zu aendern.

## Demo-Jury-Checkliste

- [x] Mock-Badge „Mock-Vision“ ist in der UI sichtbar
- [x] Scan ohne echte Credentials moeglich
- [x] Bounding Boxes ueber dem Livebild oder Demo-Frame
- [x] Bestaetigungsdialog vor Dashboard-Update
- [x] Desktop-Fallback ohne Kamera funktioniert
