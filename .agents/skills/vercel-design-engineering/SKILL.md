---
name: vercel-design-engineering
description: Vercel Geist design system and Design Engineer principles for consistent UI. Use for any visual design, layout, typography, color, component styling, copy, or UX flow decisions in this repository.
---

# Vercel Design Engineering

Agents making **design decisions** in this repo must follow this skill together with `.agents/skills/frontend-design/SKILL.md`. Read both before building or reshaping UI.

## Source of truth

| Resource | URL |
|----------|-----|
| Geist (light) | https://vercel.com/design.md |
| Geist (dark) | https://vercel.com/design.dark.md |
| Design Engineer principles | https://vercel.com/design/engineer |

This project already maps Geist tokens in `packages/ui/src/styles/globals.css` and uses **Geist Sans** / **Geist Mono** via `geist/font` in `apps/web/app/layout.tsx`. Prefer existing CSS variables (`--background`, `--foreground`, `--muted`, `--border`, `--ring`, `--status-*`) over ad-hoc hex values.

## Design Engineer principles (apply in order)

1. **Obsess over usefulness** — solve the worker/user task first; decoration second.
2. **Own the whole experience** — loading, empty, error, and success states matter as much as the happy path.
3. **Understand constraints** — mobile warehouse workers need large touch targets, camera-first layout, and legible stock numbers.
4. **Build for everyone** — WCAG AA contrast, visible `:focus-visible` rings, `prefers-reduced-motion`.
5. **Make it excellent** — one primary action per view; subtle elevation; consistent 6px / 12px radii.
6. **Make the team better** — reuse patterns from existing components; extend tokens instead of one-off styles.

## Geist rules (summary)

### Color & hierarchy

- Use gray scale for text rank: primary → secondary → disabled.
- Accent color signals **state** (low stock, error, success), not decoration.
- Never signal state with color alone — pair with label, icon, or badge text.
- `background-200` / `bg-muted/30` is for subtle page separation, not general fills.

### Typography

- **Geist Sans** for UI and prose; **Geist Mono** with `tabular-nums` for stock counts and timestamps.
- Use restrained type scale: `text-lg` section titles, `text-sm` body, `text-xs` metadata.
- Section eyebrows: `font-mono text-[10px] tracking-widest uppercase text-muted-foreground`.

### Layout

- 4px spacing scale: 8px inside groups, 16px between groups, 24–32px between sections.
- Card padding: 20–24px (`p-5` / `p-6`); compact controls 32px height (`h-8` / `size-9`).
- Mobile-first: primary task full-width; secondary panels in sheets or sidebars.

### Elevation

- Raised cards: `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` + `border border-border`.
- Popovers/menus: use shadcn `Popover` / `DropdownMenu` defaults.
- Prefer borders + tonal surfaces over heavy shadows.

### Motion

- Default to instant (`0ms`) for stock +/- and theme changes.
- When animating (stock meter width): `duration-150` with `motion-reduce:transition-none`.
- Honor `prefers-reduced-motion`.

### Components

- **Primary button**: one per view (e.g. "Kamera starten").
- **Secondary**: `variant="outline"` for +/- stock controls.
- **Ghost/icon**: header actions (bell, theme).
- Focus ring: two-layer via `--ring` (#006bff light / #47a8ff dark) — do not remove outlines.

### Voice & content (German UI)

- Title Case for labels and buttons: `Lagerbestand`, `Kamera starten`.
- Sentence case for helper text and errors.
- Actions: verb + noun (`Bestand erhöhen`), not bare `OK`.
- In-progress: `Startet…`, `Speichern…` (ellipsis character).
- Empty states name the next action: `Keine Artikel im Lager. Bestand wird nach der ersten Buchung angezeigt.`
- Toasts: specific, no "successfully", no trailing period.

## Worker / Lager UX patterns

For `apps/web/components/lager/*`:

| Priority | Surface | Rationale |
|----------|---------|-----------|
| 1 | Camera stream | Workers monitor shelves and vision detection |
| 2 | Stock list | Quick +/- adjustments after physical counts |
| 3 | Notifications | Reorder and overstock alerts via bell |

- **Desktop**: split view — inventory left (~38%), camera right.
- **Mobile**: camera full height; inventory in bottom sheet via FAB (not a cramped strip).
- Stock rows: tinted row background from `getLagerArtikelStatus` — green (`ok`), red (`empty`), orange (`warning` for too low or too high). Round +/- controls only; no text labels like "Im Soll".
- Attention count in header and mobile FAB badge when any row is not `ok`.

## Checklist before shipping UI

- [ ] Read Geist tokens in `globals.css`; no random hex except status accents already defined.
- [ ] Touch targets ≥ 44px on mobile (`size-9`, `size-11`, `touch-manipulation`).
- [ ] Empty, loading, and error states designed.
- [ ] Theme toggle supports light / dark / system (`ThemeToggle` component).
- [ ] Copy follows Voice rules above.
- [ ] `pnpm --filter web exec tsc --noEmit` passes.

## Related skills

- `.agents/skills/frontend-design/SKILL.md` — distinctive direction when the brief allows creative latitude.
- `.agents/skills/shadcn/SKILL.md` — component APIs and registries.
- `.agents/skills/improve/SKILL.md` — audit-only plans for larger UI refactors (do not implement directly).
