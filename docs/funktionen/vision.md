# Kamera-/Vision-Funktion

Die Plattform kann Baustellen- und Materialzustände per Kamera erfassen und –
nach Nutzerbestätigung – in den Materialbestand und ERP/EAP-Kontext übernehmen
(Epic #66).

## Ablauf

1. Im Bau-Dashboard „Kamera-Update starten" öffnet den Live-Scan
   (`navigator.mediaDevices.getUserMedia`, Rückkamera bevorzugt).
2. Der Stream wird mit ~1 FPS an `/api/vision/inspect` geschickt; die Antwort
   liefert Bounding Boxes, Labels, Confidence und Systemabgleich.
3. Erkannte Positionen erscheinen als Liste mit interpretierten Mengen.
4. Erst „Update bestätigen" schreibt die Mengen über die Repository-Schicht in
   den Materialbestand (Aktivität `vision_bestaetigt` + Audit-Einträge, #75).
   Ablehnen/Abbrechen lässt den Zustand unverändert.

## Demo-Modus ohne Kamera (#76)

- Button **„Demo-Modus (ohne Kamera)"** ruft dieselbe API mit stabilen
  Beispieldaten auf – ideal für Desktop-Präsentationen ohne Kamerazugriff.
- Der Vision-Backend-Detector ist aktuell ein **Mock** (`mock-vision-backend`)
  und benötigt keine Credentials und kein echtes Modell.
- Für echten Kamerazugriff braucht der Browser einen **sicheren Kontext**
  (HTTPS oder `localhost`). Auf dem Handy die Kameraberechtigung erlauben.

## Datenschutz (#94)

- Der Schalter **„Gesichter verpixeln"** (standardmäßig aktiv) legt vor dem
  Upload ein grobes Mosaik über den Frame, damit Gesichter und
  personenbezogene Details nicht übertragen werden (Demo-grade Maßnahme).
- Für eine produktive Lösung ist eine gezielte Gesichtserkennung
  (z. B. `FaceDetector`-API oder serverseitige Erkennung) vorgesehen.

## Spätere echte Anbindung

Der Datenvertrag (`label`, `confidence`, `box`, `systemMatch`, `interpreted`)
bleibt stabil, sodass der Mock-Detector später durch ein echtes Vision-Modell
oder einen externen Dienst ersetzt werden kann, ohne die UI zu ändern.
