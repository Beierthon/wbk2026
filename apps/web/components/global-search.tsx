"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { SearchIcon } from "lucide-react"

import {
  getSearchKindLabel,
  searchProjectIndex,
  type ProjectSearchEntry,
  type ProjectSearchIndex,
} from "@/lib/search/project-search"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@workspace/ui/components/command"
import { Kbd } from "@workspace/ui/components/kbd"

function SearchResultItem({ entry }: { entry: ProjectSearchEntry }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{entry.title}</span>
        <Badge variant="outline" className="shrink-0">
          {getSearchKindLabel(entry.kind)}
        </Badge>
        <Badge variant="secondary" className="shrink-0">
          {entry.domainLabel}
        </Badge>
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">
        {entry.snippet}
      </p>
    </div>
  )
}

export function GlobalSearch({ index }: { index: ProjectSearchIndex }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const results = React.useMemo(
    () => searchProjectIndex(index, query),
    [index, query]
  )

  function handleSelect(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="ml-auto hidden h-8 w-full max-w-sm justify-start gap-2 bg-muted/40 px-3 text-muted-foreground md:flex"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4 shrink-0 opacity-60" />
        <span className="truncate">Search project knowledge…</span>
        <CommandShortcut className="ml-auto hidden lg:inline-flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </CommandShortcut>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="ml-auto md:hidden"
        aria-label="Search project knowledge"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Global project search"
        description="Find plans, conflicts, materials, assets, and costs in the project."
      >
        <CommandInput
          placeholder="Search plans, conflicts, materials, assets, costs…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results for this search.</CommandEmpty>
          <CommandGroup heading="Results">
            {results.map((entry) => (
              <CommandItem
                key={`${entry.kind}-${entry.id}`}
                value={`${entry.title} ${entry.snippet}`}
                onSelect={() => handleSelect(entry.href)}
              >
                <SearchResultItem entry={entry} />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
