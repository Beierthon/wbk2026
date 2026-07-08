"use client"

import type { ReactNode } from "react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export const PERSONA_VIEWS = ["planner", "worker", "maintainer"] as const
export type PersonaView = (typeof PERSONA_VIEWS)[number]
export const ACTIVE_PERSONA: PersonaView = "worker"

export function PersonaViewTabs({ children }: { children: ReactNode }) {
  return (
    <Tabs value={ACTIVE_PERSONA} className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-center border-b border-border bg-background px-4 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <TabsList variant="line" aria-label="View">
          <TabsTrigger value="planner" disabled>
            Planner
          </TabsTrigger>
          <TabsTrigger value="worker">Worker</TabsTrigger>
          <TabsTrigger value="maintainer" disabled>
            Maintainer
          </TabsTrigger>
        </TabsList>
      </header>
      <TabsContent value="worker" className="flex min-h-0 flex-1 flex-col">
        {children}
      </TabsContent>
    </Tabs>
  )
}
