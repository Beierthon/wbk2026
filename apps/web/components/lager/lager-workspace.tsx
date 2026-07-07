"use client"

import Image from "next/image"

import { LagerBestandPanel } from "@/components/lager/lager-bestand-panel"
import { LagerKameraPanel } from "@/components/lager/lager-kamera-panel"
import { ShellNotifications } from "@/components/shell-notifications"
import type { Aktivitaet, LagerArtikel } from "@workspace/domain"

interface LagerWorkspaceProps {
  projectId: string
  artikel: LagerArtikel[]
  aktivitaeten: Aktivitaet[]
}

export function LagerWorkspace({
  projectId,
  artikel,
  aktivitaeten,
}: LagerWorkspaceProps) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <Image
          src="/brand/wbk-mark.svg"
          alt="WBK"
          width={32}
          height={32}
          className="size-8 shrink-0 md:size-9"
          priority
        />
        <ShellNotifications
          projectId={projectId}
          aktivitaeten={aktivitaeten}
          hideLogLink
          iconOnly
        />
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <section className="order-2 flex min-h-0 max-h-[42dvh] flex-col border-t border-border/60 md:order-1 md:max-h-none md:w-[min(24rem,40%)] md:flex-1 md:border-t-0 md:border-r lg:w-[min(28rem,38%)]">
          <LagerBestandPanel artikel={artikel} className="flex-1" />
        </section>

        <section className="order-1 flex min-h-[48dvh] flex-1 flex-col md:order-2 md:min-h-0">
          <LagerKameraPanel projectId={projectId} className="flex-1" />
        </section>
      </div>
    </div>
  )
}
