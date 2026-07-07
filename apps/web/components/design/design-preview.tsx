import type { CSSProperties } from "react"
import {
  AlertTriangle,
  HardHat,
  Home,
  Layers,
  Plus,
  Smartphone,
} from "lucide-react"

import type { DesignVariant } from "@/lib/design/variants"

import { DesignFontLoader } from "./design-font-loader"

const openItems = [
  { title: "Axis B shell", tone: "alert" as const },
  { title: "Window delivery", tone: "signal" as const },
]

const materialActions = ["Low", "Delivered", "Replacement"]

export function DesignPreview({
  variant,
  showMeta = false,
}: {
  variant: DesignVariant
  showMeta?: boolean
}) {
  const { tokens: t } = variant

  return (
    <>
      <DesignFontLoader href={variant.fontUrl} />
      <div
        className="design-preview relative mx-auto w-full max-w-sm overflow-hidden"
        style={
          {
            "--d-bg": t.bg,
            "--d-surface": t.surface,
            "--d-text": t.text,
            "--d-muted": t.muted,
            "--d-accent": t.accent,
            "--d-accent-text": t.accentText,
            "--d-border": t.border,
            "--d-alert": t.alert,
            "--d-ok": t.ok,
            "--d-radius": t.radius,
            "--d-shadow": t.shadow,
            "--d-display": variant.fontDisplay,
            "--d-body": variant.fontBody,
            fontFamily: "var(--d-body)",
            color: "var(--d-text)",
            background: "var(--d-bg)",
          } as CSSProperties
        }
      >
        {variant.slug === "blueprint" ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(var(--d-accent) 1px, transparent 1px), linear-gradient(90deg, var(--d-accent) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        ) : null}

        <div className="relative flex min-h-[640px] flex-col">
          {/* Header */}
          <header
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: `1px solid var(--d-border)`,
              ...(variant.slug === "stamp-red"
                ? {
                    background: "var(--d-accent)",
                    color: "var(--d-accent-text)",
                  }
                : {}),
            }}
          >
            <div className="flex items-center gap-2">
              <HardHat
                className="size-5 shrink-0"
                style={{
                  color:
                    variant.slug === "stamp-red"
                      ? "var(--d-accent-text)"
                      : "var(--d-accent)",
                }}
                strokeWidth={2}
              />
              <span
                className="text-sm font-semibold tracking-wide"
                style={{ fontFamily: "var(--d-display)" }}
              >
                WBK
              </span>
              <span
                className="text-xs"
                style={{
                  color:
                    variant.slug === "stamp-red"
                      ? "rgba(255,255,255,0.75)"
                      : "var(--d-muted)",
                }}
              >
                West
              </span>
            </div>
            <span
              className="size-2 rounded-full"
              style={{
                background: "var(--d-ok)",
                boxShadow: "0 0 8px var(--d-ok)",
              }}
              title="Live"
            />
          </header>

          {/* Stats — numbers only, tiny labels */}
          <div className="grid grid-cols-2 gap-3 px-4 py-4">
            {[
              { value: "2", label: "open", tone: "signal" },
              { value: "1", label: "critical", tone: "alert" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="px-3 py-3"
                style={{
                  background: "var(--d-surface)",
                  borderRadius: "var(--d-radius)",
                  boxShadow: "var(--d-shadow)",
                  border:
                    variant.slug === "signal-yard"
                      ? `1px solid var(--d-border)`
                      : undefined,
                  borderLeft:
                    variant.slug === "signal-yard"
                      ? `4px solid var(--d-accent)`
                      : variant.slug === "volt-line"
                        ? `3px solid ${stat.tone === "alert" ? "var(--d-alert)" : "var(--d-accent)"}`
                        : undefined,
                }}
              >
                <p
                  className="text-3xl leading-none font-bold tabular-nums"
                  style={{
                    fontFamily: "var(--d-display)",
                    color:
                      stat.tone === "alert"
                        ? "var(--d-alert)"
                        : "var(--d-text)",
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="mt-1 text-[10px] tracking-widest uppercase"
                  style={{ color: "var(--d-muted)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <div className="px-4 pb-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 py-4 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: "var(--d-accent)",
                color: "var(--d-accent-text)",
                borderRadius:
                  variant.slug === "field-kit" ? "9999px" : "var(--d-radius)",
                fontFamily: "var(--d-display)",
                boxShadow:
                  variant.slug === "night-beacon"
                    ? "0 0 32px rgba(232,120,58,0.45)"
                    : variant.slug === "stamp-red"
                      ? "4px 4px 0 var(--d-border)"
                      : undefined,
              }}
            >
              <Plus className="size-5" strokeWidth={2.5} />
              Report
            </button>
          </div>

          {/* Material quick row */}
          <div className="px-4 pb-4">
            <p
              className="mb-2 truncate text-xs font-medium"
              style={{ color: "var(--d-muted)" }}
            >
              Concrete C25/30
            </p>
            <div className="grid grid-cols-3 gap-2">
              {materialActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="py-3 text-[11px] font-semibold tracking-wide uppercase"
                  style={{
                    background: "var(--d-surface)",
                    color: "var(--d-text)",
                    borderRadius:
                      variant.slug === "field-kit"
                        ? "9999px"
                        : "var(--d-radius)",
                    border: `1px solid var(--d-border)`,
                    boxShadow:
                      variant.slug === "steel-deck"
                        ? "var(--d-shadow)"
                        : undefined,
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Open items — title + dot only */}
          <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
            {openItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 px-3 py-3"
                style={{
                  background: "var(--d-surface)",
                  borderRadius: "var(--d-radius)",
                  border: `1px solid var(--d-border)`,
                  boxShadow: "var(--d-shadow)",
                  borderBottom:
                    variant.slug === "copper-wire"
                      ? `2px solid ${item.tone === "alert" ? "var(--d-alert)" : "var(--d-accent)"}`
                      : undefined,
                }}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    background:
                      item.tone === "alert"
                        ? "var(--d-alert)"
                        : "var(--d-accent)",
                  }}
                />
                <span
                  className="truncate text-sm font-medium"
                  style={{ fontFamily: "var(--d-display)" }}
                >
                  {item.title}
                </span>
                {item.tone === "alert" ? (
                  <AlertTriangle
                    className="ml-auto size-4 shrink-0"
                    style={{ color: "var(--d-alert)" }}
                  />
                ) : null}
              </div>
            ))}
          </div>

          {/* Bottom nav — icons only */}
          <nav
            className="mt-auto grid grid-cols-4 gap-1 px-2 py-2"
            style={{
              borderTop: `1px solid var(--d-border)`,
              background:
                variant.slug === "volt-line"
                  ? "var(--d-surface)"
                  : "transparent",
            }}
          >
            {[
              { icon: Home, active: false },
              { icon: Smartphone, active: true },
              { icon: Layers, active: false },
              { icon: HardHat, active: false },
            ].map(({ icon: Icon, active }, index) => (
              <button
                key={index}
                type="button"
                className="flex flex-col items-center justify-center py-2"
                style={{
                  color: active ? "var(--d-accent)" : "var(--d-muted)",
                  borderBottom:
                    variant.slug === "volt-line" && active
                      ? "3px solid var(--d-accent)"
                      : variant.slug === "copper-wire" && active
                        ? "2px solid var(--d-accent)"
                        : "3px solid transparent",
                }}
                aria-label={active ? "Active" : "Navigation"}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 1.75} />
              </button>
            ))}
          </nav>

          {showMeta ? (
            <footer
              className="border-t px-4 py-3 text-xs"
              style={{
                borderColor: "var(--d-border)",
                color: "var(--d-muted)",
              }}
            >
              <p style={{ fontFamily: "var(--d-display)" }}>
                {variant.signature}
              </p>
            </footer>
          ) : null}
        </div>
      </div>
    </>
  )
}
