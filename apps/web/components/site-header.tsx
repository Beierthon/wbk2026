import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"

export function SiteHeader({
  role = "Worker",
  subpage,
}: {
  role?: string
  subpage?: string
}) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear md:h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-10 md:group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-2 sm:px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="flex min-w-0 items-baseline gap-1.5 truncate text-base font-medium">
          <span className="truncate">{role}</span>
          {subpage ? (
            <>
              <span
                aria-hidden
                className="shrink-0 text-sm font-normal text-muted-foreground"
              >
                /
              </span>
              <span className="truncate">{subpage}</span>
            </>
          ) : null}
        </h1>
      </div>
    </header>
  )
}
