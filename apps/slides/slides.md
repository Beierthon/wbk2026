---
theme: default
title: WBK 2026
lang: de
info: |
  Demo-Präsentation für WBK 2026 — Planung, Bauausführung und Betrieb in einer Plattform.
fonts:
  sans: Geist Sans
  mono: Geist Mono
css: unocss
drawings:
  persist: false
transition: slide-left
mdc: true
base: /slides/
routerMode: hash
---

<style src="./styles/index.css"></style>

---
layout: cover
class: text-center
---

<div class="flex flex-col items-center justify-center h-full gap-6">
  <WbkLogo img-class="w-80" />
  <p class="wbk-eyebrow">Hackathon 2026</p>
  <h1 class="text-3xl font-medium !mt-0">Planung → Bau → Betrieb</h1>
  <p class="text-lg opacity-80 max-w-xl">
    Eine gemeinsame Projektwahrheit über alle Phasen eines realen Bauprojekts.
  </p>
</div>

---
layout: center
class: bg-geist-grid
---

<div class="max-w-3xl mx-auto text-center">
  <p class="wbk-eyebrow mb-4">Kernbotschaft</p>
  <h2 class="text-3xl font-medium leading-tight">
    WBK 2026 zeigt nicht nur getrennte Dashboards, sondern den
    <span class="wbk-accent">durchgängigen Lebenszyklus</span>
    eines realen Bauprojekts.
  </h2>
  <p class="mt-6 text-lg text-[var(--muted-foreground)]">
    Planer liefern Planstände, Bau-Teams melden Konflikte zurück, Betreiber übernehmen die vollständige Historie für Wartung, Assets und Entscheidungen.
  </p>
</div>

---
layout: two-cols
---

<div>
  <p class="wbk-eyebrow mb-3">Problem</p>
  <h2 class="text-2xl font-medium">Getrennte Werkzeuge, verlorene Kontexte</h2>
  <ul class="wbk-list mt-6 text-base">
    <li>Planung, Bauausführung und Betrieb arbeiten in isolierten Systemen</li>
    <li>Konflikte aus der Realität erreichen die Planung zu spät</li>
    <li>Materialschwund und Nachkauf bleiben unsichtbar</li>
    <li>Betreiber übernehmen ein Bauwerk ohne Entscheidungshistorie</li>
  </ul>
</div>

::right::

<div class="wbk-card h-full flex flex-col justify-center">
  <p class="wbk-eyebrow mb-3">Heute typisch</p>
  <div class="space-y-4 text-sm">
    <div class="flex items-center gap-3">
      <span class="wbk-pill">Planung</span>
      <span class="opacity-40">↔</span>
      <span class="wbk-pill wbk-pill--signal">kein Rückkanal</span>
    </div>
    <div class="flex items-center gap-3">
      <span class="wbk-pill">Bau</span>
      <span class="opacity-40">↔</span>
      <span class="wbk-pill wbk-pill--signal">Excel &amp; WhatsApp</span>
    </div>
    <div class="flex items-center gap-3">
      <span class="wbk-pill">Betrieb</span>
      <span class="opacity-40">↔</span>
      <span class="wbk-pill wbk-pill--signal">fehlende Historie</span>
    </div>
  </div>
  <p class="mt-6 text-[var(--muted-foreground)] text-sm">
    WBK verbindet alle drei Domänen in einem gemeinsamen Projektkontext.
  </p>
</div>

---
layout: default
class: bg-geist-grid
---

<p class="wbk-eyebrow mb-3">Zielgruppen</p>

<h2 class="text-2xl font-medium mb-2">Eine Plattform, drei Domänen</h2>

<div class="wbk-cols-3">
  <div class="wbk-card">
    <p class="wbk-eyebrow mb-2">Planung</p>
    <p class="font-medium mb-2">Architektur, Tragwerk, TGA</p>
    <p class="text-sm text-[var(--muted-foreground)]">
      Planstände veröffentlichen, Konflikte beantworten, Kostenwirkung sehen.
    </p>
  </div>
  <div class="wbk-card">
    <p class="wbk-eyebrow mb-2">Bau</p>
    <p class="font-medium mb-2">Bauleitung, Teams, Einkauf</p>
    <p class="text-sm text-[var(--muted-foreground)]">
      Fortschritt melden, Konflikte dokumentieren, Material und Lager steuern.
    </p>
  </div>
  <div class="wbk-card">
    <p class="wbk-eyebrow mb-2">Betrieb</p>
    <p class="font-medium mb-2">FM, Wartung, Betreiber</p>
    <p class="text-sm text-[var(--muted-foreground)]">
      Historie, Assets und Wartungsfolgen aus dem Bau übernehmen.
    </p>
  </div>
</div>

---
layout: default
---

<p class="wbk-eyebrow mb-3">Nutzenversprechen</p>

<h2 class="text-2xl font-medium mb-6">Was WBK 2026 liefert</h2>

<ul class="wbk-list text-base grid grid-cols-2 gap-x-8">
  <li>Eine gemeinsame Projektwahrheit über alle Phasen</li>
  <li>Konflikte, Kosten- und Zeitwirkung jederzeit nachvollziehbar</li>
  <li>Material- und Kostenwahrheit: geplant, verbaut, Schwund, Prognose</li>
  <li>Reale Baustellenlage per Kamera-Scan, bestätigt ins System</li>
  <li>Audit Trail für Entscheidungen und Verantwortlichkeiten</li>
  <li>ERP/EAP-Daten mit klarer Herkunftskennung</li>
</ul>

---
layout: default
class: bg-geist-grid
---

<p class="wbk-eyebrow mb-3">Demo-Szenario</p>

<h2 class="text-2xl font-medium mb-4">Beispielkonflikt: Gründungsplanung</h2>

<div class="wbk-steps text-sm">
  <div class="wbk-step">Planer veröffentlicht die initiale Gründungsplanung</div>
  <div class="wbk-step">Bau-Team stellt abweichende Bodenverhältnisse fest und meldet Konflikt</div>
  <div class="wbk-step">Kommentar, Risikobewertung und Kostenprognose entstehen</div>
  <div class="wbk-step">Planung passt Planstand an und veröffentlicht neue Version</div>
  <div class="wbk-step">Kosten- und Zeitplanwirkung werden im Cockpit sichtbar</div>
  <div class="wbk-step">Betreiber übernimmt Historie, Assets und Wartungsfolgen</div>
</div>

---
layout: iframe
url: https://wbk.2026.hackathon.kevinbeier.com/worker/overview
scale: 0.9
---

<LiveAppLink href="https://wbk.2026.hackathon.kevinbeier.com/worker/overview" label="Live-App in neuem Tab öffnen" />

---
layout: two-cols
---

<div>
  <p class="wbk-eyebrow mb-3">Live-Demo</p>
  <h2 class="text-2xl font-medium">Worker Overview</h2>
  <p class="mt-4 text-[var(--muted-foreground)]">
    Die Worker-Ansicht vereint Lagerbestand und Kamera-Scan in einem Arbeitsbereich — optimiert für Baustellen- und Lager-Teams.
  </p>
  <ul class="wbk-list mt-6 text-sm">
    <li>Resizable Split-Layout für Bestand und Kamera</li>
    <li>Touch-freundliche Bestandsbuchung</li>
    <li>Vision-Scan mit Bestätigung vor System-Update</li>
    <li>Signal-Farben für Planabweichungen</li>
  </ul>
</div>

::right::

<div class="wbk-card h-full flex flex-col gap-4 justify-center">
  <div>
    <p class="wbk-eyebrow mb-2">Links</p>
    <p class="font-medium">Lagerbestand</p>
    <p class="text-sm text-[var(--muted-foreground)]">Artikel, Mengen, Schnellbuchung</p>
  </div>
  <div>
    <p class="wbk-eyebrow mb-2">Rechts</p>
    <p class="font-medium">Kamera-Panel</p>
    <p class="text-sm text-[var(--muted-foreground)]">Scan, Erkennung, Bestätigung</p>
  </div>
  <div class="flex gap-2 flex-wrap">
    <span class="wbk-pill wbk-pill--ok">auf Plan</span>
    <span class="wbk-pill wbk-pill--signal">Abweichung</span>
  </div>
</div>

---
layout: default
---

<p class="wbk-eyebrow mb-3">Technische Säulen</p>

<h2 class="text-2xl font-medium mb-6">Architektur &amp; Stack</h2>

<div class="grid grid-cols-2 gap-4 text-sm">
  <div class="wbk-card">
    <p class="font-medium mb-1">Next.js + shadcn/ui</p>
    <p class="text-[var(--muted-foreground)]">Ruhiges, dichtes Dashboard mit Geist Sans/Mono</p>
  </div>
  <div class="wbk-card">
    <p class="font-medium mb-1">Repository-Schicht</p>
    <p class="text-[var(--muted-foreground)]">Mock zuerst, Supabase-Adapter identisch</p>
  </div>
  <div class="wbk-card">
    <p class="font-medium mb-1">Analytics-Engines</p>
    <p class="text-[var(--muted-foreground)]">Schwundquote, Kostenprognose, Baseline</p>
  </div>
  <div class="wbk-card">
    <p class="font-medium mb-1">Vision</p>
    <p class="text-[var(--muted-foreground)]">Kamera-Scan mit Bestätigung, Demo-Modus</p>
  </div>
  <div class="wbk-card col-span-2">
    <p class="font-medium mb-1">ERP/EAP-Adapter</p>
    <p class="text-[var(--muted-foreground)]">Externe Material- und Betriebsdaten mit Herkunftskennung</p>
  </div>
</div>

---
layout: center
class: text-sm
---

<p class="wbk-eyebrow mb-4">Ablauf</p>

<h2 class="text-xl font-medium mb-6">Planung → Bau → Betrieb</h2>

```mermaid {scale: 0.75}
sequenceDiagram
  autonumber
  participant Planung as Planung
  participant Bau as Bauausführung
  participant Analytics as Analytics
  participant Plattform as Plattform
  participant Betrieb as Betrieb

  Planung->>Plattform: Planstand Gründung v1
  Bau->>Plattform: Konflikt Bodenverhältnisse
  Bau->>Analytics: Ist-Material, Verlust
  Analytics->>Plattform: Kostenprognose
  Planung->>Plattform: Planstand v2 veröffentlichen
  Plattform-->>Betrieb: Audit Trail, Assets, Historie
```

---
layout: end
class: text-center
---

<div class="flex flex-col items-center gap-6">
  <WbkMark img-class="w-20" />
  <h2 class="text-2xl font-medium !mt-0">WBK 2026</h2>
  <div class="flex flex-col gap-3 text-base">
    <a href="/slides/" target="_blank">
      Präsentation: /slides
    </a>
    <a href="https://wbk.2026.hackathon.kevinbeier.com/worker/overview" target="_blank">
      Live-App: Worker Overview
    </a>
    <a href="https://github.com/Beierthon/wbk2026" target="_blank">
      GitHub: Beierthon/wbk2026
    </a>
  </div>
  <p class="text-sm opacity-60 mt-4">
    Fragen? Diskussion gerne nach der Demo.
  </p>
</div>
