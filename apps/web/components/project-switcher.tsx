"use client"

import { useTransition } from "react"
import { ChevronsUpDown } from "lucide-react"

import { switchProjectAction } from "@/lib/actions/project-session-actions"
import type { Bauprojekt } from "@workspace/domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export function ProjectSwitcher({
  projects,
  activeProjectId,
}: {
  projects: Bauprojekt[]
  activeProjectId: string
}) {
  const [pending, startTransition] = useTransition()
  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? projects[0]

  if (!activeProject) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 max-w-full gap-2"
            disabled={pending}
          />
        }
      >
        <span className="truncate text-left">{activeProject.name}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Projekt wechseln</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => {
                if (project.id === activeProjectId) {
                  return
                }

                startTransition(async () => {
                  await switchProjectAction(project.id)
                })
              }}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-medium">{project.name}</span>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {project.phase}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {project.status}
                  </Badge>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
