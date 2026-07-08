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

function getOverviewSubpage(pathname: string, basePath: string): string | undefined {
  if (pathname === basePath || pathname.startsWith(`${basePath}/overview`)) {
    return "Overview"
  }
  return undefined
}

function getWorkerSubpage(pathname: string): string | undefined {
  const overview = getOverviewSubpage(pathname, "/worker")
  if (overview) return overview
  if (pathname.startsWith("/worker/lager")) {
    return "ERP-Bestand"
  }
  if (pathname.startsWith("/worker/observability")) {
    return "Kameraübersicht"
  }
  return undefined
}

function getPlannerSubpage(pathname: string): string | undefined {
  return getOverviewSubpage(pathname, "/planner")
}

function getMaintainerSubpage(pathname: string): string | undefined {
  return getOverviewSubpage(pathname, "/maintainer")
}

export function getShellHeaderParts(pathname: string): {
  role: string
  subpage?: string
} {
  const tab = getShellTab(pathname)
  const role = ROLE_LABELS[tab]

  const subpage =
    tab === "worker"
      ? getWorkerSubpage(pathname)
      : tab === "planner"
        ? getPlannerSubpage(pathname)
        : getMaintainerSubpage(pathname)

  return subpage ? { role, subpage } : { role }
}
