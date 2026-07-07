---
name: Sidebar Theme Toggle
about: Triaged feature request for dark/light theme toggle in the sidebar
title: "Sidebar: Dark/Light Theme Toggle hinzufügen"
labels:
  - enhancement
  - "bereich: ux"
  - "bereich: designsystem"
  - "priorität: mittel"
  - "gute erste umsetzung"
assignees: ""
---

## Zusammenfassung

Die App unterstützt bereits Dark/Light-Mode über `next-themes` und CSS-Variablen, aber es gibt **keine sichtbare UI** zum Umschalten. Nutzer können derzeit nur die Tastenkürzel `d` verwenden — das ist für die meisten nicht auffindbar.

## Problem

- `ThemeProvider` ist in `apps/web/app/layout.tsx` eingebunden
- Tastenkürzel `d` togglet Dark ↔ Light in `apps/web/components/theme-provider.tsx`
- In der Sidebar (`apps/web/components/app-shell.tsx`) fehlt ein Theme-Schalter
- Kein `ThemeToggle`-Component vorhanden

## Vorschlag

Einen sichtbaren Theme-Toggle im **`SidebarFooter`** von `AppShell` platzieren:

- [ ] Neues Client-Component `apps/web/components/theme-toggle.tsx`
- [ ] Nutzung von `SidebarMenuButton` mit `tooltip` (wichtig bei eingeklappter Sidebar)
- [ ] Icons `Sun` / `Moon` aus `lucide-react`
- [ ] Deutsche Labels: „Hell“, „Dunkel“
- [ ] Hydration-Guard (`mounted`-State) gegen SSR-Mismatch
- [ ] Bestehendes Tastenkürzel `d` beibehalten

## Akzeptanzkriterien

- [ ] Toggle ist im Sidebar-Footer sichtbar
- [ ] Klick wechselt zwischen Hell- und Dunkelmodus
- [ ] Tooltip funktioniert bei eingeklappter Sidebar (Icon-Modus)
- [ ] Keine Hydration-Warnings in der Konsole
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` sind grün

## Technischer Kontext

| Datei | Rolle |
|-------|-------|
| `apps/web/components/theme-provider.tsx` | `next-themes` Provider + Hotkey |
| `apps/web/components/app-shell.tsx` | Sidebar-Layout, Einfügepunkt |
| `packages/ui/src/styles/globals.css` | Light/Dark CSS-Tokens inkl. Sidebar |
| `packages/ui/src/components/sidebar.tsx` | Sidebar-Primitives |

## Aufwand

Klein — Infrastruktur existiert bereits, nur UI-Component + eine Zeile in `app-shell.tsx`.
