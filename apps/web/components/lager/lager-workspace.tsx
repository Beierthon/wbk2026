"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bell } from "lucide-react"

import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import { RealtimeStatusBadge } from "@/components/realtime-status-badge"
import { ResizeHandle } from "@/components/lager/resize-handle"
import { ThemeToggle } from "@/components/theme-toggle"
import { ActivityInboxPanel } from "@/components/notifications/activity-inbox-panel"
import {
  ActivityInboxProvider,
  useActivityInbox,
} from "@/components/notifications/activity-inbox-provider"
import { useLiveLagerArtikel } from "@/hooks/use-live-lager-artikel"
import { usePanelResize } from "@/hooks/use-panel-resize"
import { countAttentionArtikel } from "@/lib/lager/status"
import type { Aktivitaet, LagerArtikel } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

const SIDEBAR_MIN = 240
const SIDEBAR_DEFAULT = 384
const SIDEBAR_STORAGE_KEY = "wbk-lager-sidebar-width"
const STOCK_OVERRIDE_TTL_MS = 10000

type LagerView = "dashboard" | "cameras" | "lager"

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--status-signal)] font-mono text-[11px] font-semibold tabular-nums text-background not-italic">
      {count > 9 ? "9+" : count}
    </span>
  )
}

interface LagerWorkspaceProps {
  projectId: string
  artikel: LagerArtikel[]
  aktivitaeten: Aktivitaet[]
  realtimeEnabled?: boolean
}

export function LagerWorkspace({
  projectId,
  artikel,
  aktivitaeten,
  realtimeEnabled = false,
}: LagerWorkspaceProps) {
  const [stockOverrides, setStockOverrides] = useState<Record<string, number>>(
    {}
  )
  const stockOverrideTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({})
  const {
    artikel: liveArtikel,
    status: realtimeStatus,
    applyLocalStock,
    removeLocal,
  } = useLiveLagerArtikel(projectId, artikel, realtimeEnabled)
  const [isDesktop, setIsDesktop] = useState(false)
  const [view, setView] = useState<LagerView>("dashboard")
  const [sidebarMaxWidth, setSidebarMaxWidth] = useState(560)
  const cardRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    setStockOverrides((current) => {
      const next = { ...current }
      let changed = false

      for (const item of liveArtikel) {
        const override = next[item.id]
        if (override === undefined) {
          continue
        }

        if (override === item.aktuell) {
          delete next[item.id]
          changed = true
          continue
        }

        const timer = stockOverrideTimers.current[item.id]
        if (timer) {
          clearTimeout(timer)
          delete stockOverrideTimers.current[item.id]
        }
        delete next[item.id]
        changed = true
      }

      return changed ? next : current
    })
  }, [liveArtikel])

  useEffect(() => {
    const timers = stockOverrideTimers.current
    return () => {
      for (const timer of Object.values(timers)) {
        clearTimeout(timer)
      }
    }
  }, [])

  useEffect(() => {
    const row = cardRowRef.current
    if (!row) return

    const update = () => {
      setSidebarMaxWidth(
        Math.max(SIDEBAR_MIN, Math.floor(row.clientWidth * 0.55))
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(row)
    return () => observer.disconnect()
  }, [])

  const {
    size: sidebarWidth,
    isDragging: sidebarDragging,
    handleProps: sidebarHandleProps,
  } = usePanelResize({
    axis: "x",
    initial: SIDEBAR_DEFAULT,
    min: SIDEBAR_MIN,
    max: sidebarMaxWidth,
    storageKey: SIDEBAR_STORAGE_KEY,
  })

  const items = useMemo(
    () =>
      liveArtikel.map((item) => ({
        ...item,
        aktuell: stockOverrides[item.id] ?? item.aktuell,
      })),
    [liveArtikel, stockOverrides]
  )

  const attentionCount = useMemo(() => countAttentionArtikel(items), [items])

  const { hydrated: notificationsHydrated, inboxCount } = useActivityInbox({
    projectId,
    aktivitaeten,
  })
  const notificationsBadgeCount = notificationsHydrated
    ? inboxCount
    : aktivitaeten.length

  const handleStockChange = (id: string, aktuell: number) => {
    applyLocalStock(id, aktuell)
    setStockOverrides((current) => ({ ...current, [id]: aktuell }))

    const existingTimer = stockOverrideTimers.current[id]
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    stockOverrideTimers.current[id] = setTimeout(() => {
      setStockOverrides((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
      delete stockOverrideTimers.current[id]
    }, STOCK_OVERRIDE_TTL_MS)
  }

  return (
    <ActivityInboxProvider projectId={projectId} aktivitaeten={aktivitaeten}>
    <div
      className={cn(
        "bg-geist-grid relative flex h-dvh min-h-0 flex-col overflow-hidden font-sans not-italic antialiased",
        "pt-[max(0.5rem,env(safe-area-inset-top))]",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "pl-[max(0.5rem,env(safe-area-inset-left))]",
        "pr-[max(0.5rem,env(safe-area-inset-right))]"
      )}
    >
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col p-2 sm:p-3 md:p-4 lg:p-5">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border sm:rounded-2xl",
            "bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          )}
        >
          <Tabs
            value={view}
            onValueChange={(next) => setView(next as LagerView)}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 sm:px-4 sm:py-3">
              <TabsList className="grid h-9 w-full max-w-[28rem] grid-cols-3">
                <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="cameras" className="text-xs sm:text-sm">
                  Kameras
                </TabsTrigger>
                <TabsTrigger value="lager" className="relative text-xs sm:text-sm">
                  Lager
                  <CountBadge count={attentionCount} />
                </TabsTrigger>
              </TabsList>

              <div className="flex shrink-0 items-center gap-1.5">
                <RealtimeStatusBadge status={realtimeStatus} />
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        className="relative size-11 shrink-0 rounded-full touch-manipulation"
                        aria-label="Benachrichtigungen"
                      />
                    }
                  >
                    <Bell className="size-6" />
                    <CountBadge count={notificationsBadgeCount} />
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="flex w-[min(360px,calc(100vw-1.5rem))] flex-col gap-0 overflow-hidden p-0"
                  >
                    <ActivityInboxPanel
                      projectId={projectId}
                      aktivitaeten={aktivitaeten}
                      maxHeightClassName="max-h-[min(26rem,calc(100svh-12rem))]"
                    />
                  </PopoverContent>
                </Popover>

                <ThemeToggle className="size-11 rounded-full" menuSide="bottom" />
              </div>
            </div>

            <TabsContent
              value="dashboard"
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              <div
                ref={cardRowRef}
                className="flex min-h-0 flex-1 flex-col md:min-h-[24rem] md:flex-row lg:min-h-[28rem]"
              >
                {isDesktop ? (
                  <>
                    <section
                      className={cn(
                        "hidden min-h-0 shrink-0 flex-col overflow-hidden md:flex",
                        !sidebarDragging &&
                          "lager-split-panel motion-reduce:transition-none"
                      )}
                      style={{ width: sidebarWidth }}
                    >
                      <LagerBestandPanel
                        artikel={items}
                        onStockChange={handleStockChange}
                        onDelete={removeLocal}
                        className="flex-1 p-4 lg:p-5"
                      />
                    </section>
                    <ResizeHandle
                      orientation="horizontal"
                      isDragging={sidebarDragging}
                      className="-mx-0.5 hidden md:flex"
                      onPointerDown={sidebarHandleProps.onPointerDown}
                      onPointerMove={sidebarHandleProps.onPointerMove}
                      onPointerUp={sidebarHandleProps.onPointerEnd}
                      onPointerCancel={sidebarHandleProps.onPointerCancel}
                    />
                  </>
                ) : null}

                <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <LagerKameraPanel
                    projectId={projectId}
                    artikel={items}
                    className="min-h-0 flex-1"
                    dockInset={false}
                    onStockChange={handleStockChange}
                  />
                </section>
              </div>
            </TabsContent>

            <TabsContent
              value="cameras"
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                <LagerKameraPanel
                  projectId={projectId}
                  artikel={items}
                  className="min-h-0 flex-1"
                  dockInset={false}
                  onStockChange={handleStockChange}
                />
              </section>
            </TabsContent>

            <TabsContent
              value="lager"
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <LagerBestandPanel
                  artikel={items}
                  onStockChange={handleStockChange}
                  onDelete={removeLocal}
                  className="min-h-0 flex-1 p-4 lg:p-5"
                />
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
    </ActivityInboxProvider>
  )
}
