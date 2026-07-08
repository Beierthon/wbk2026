"use client"

import { ActivityNotificationPresenter } from "@/components/notifications/activity-notification-presenter"
import { WorkerShell } from "@/components/worker/worker-shell"
import type { AppShellData } from "@/lib/data/app-shell-data"

export function AppShellNotificationsRoot({
  shellData,
  children,
}: {
  shellData: AppShellData
  children: React.ReactNode
}) {
  return (
    <ActivityNotificationPresenter
      projectId={shellData.projectId}
      aktivitaeten={shellData.aktivitaeten}
    >
      <WorkerShell
        projectId={shellData.projectId}
        aktivitaeten={shellData.aktivitaeten}
        projects={shellData.projects}
      >
        {children}
      </WorkerShell>
    </ActivityNotificationPresenter>
  )
}
