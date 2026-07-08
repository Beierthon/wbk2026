export type ShellTab = "worker" | "planner" | "maintainer"

const ROLE_LABELS: Record<ShellTab, string> = {
  worker: "Worker",
  planner: "Planner",
  maintainer: "Maintainer",
}

export function getShellTab(pathname: string): ShellTab {
  if (pathname.startsWith("/planner")) return "planner"
  if (pathname.startsWith("/maintainer")) return "maintainer"
  return "worker"
}

function getWorkerSubpage(pathname: string): string | undefined {
  if (pathname === "/worker" || pathname.startsWith("/worker/overview")) {
    return "Overview"
  }
  if (pathname.startsWith("/worker/lager")) {
    return "ERP-Bestand"
  }
  if (pathname.startsWith("/worker/observability")) {
    return "Observability"
  }
  return undefined
}

export function getShellHeaderParts(pathname: string): {
  role: string
  subpage?: string
} {
  const tab = getShellTab(pathname)
  const role = ROLE_LABELS[tab]

  if (tab === "worker") {
    const subpage = getWorkerSubpage(pathname)
    return subpage ? { role, subpage } : { role }
  }

  return { role }
}
