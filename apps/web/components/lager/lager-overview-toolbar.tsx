"use client"

import { useEffect, useRef } from "react"
import { Search, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import { LagerArtikelFormDialog } from "./lager-artikel-form-dialog"

interface LagerOverviewToolbarProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  searchExpanded: boolean
  onSearchExpandedChange: (expanded: boolean) => void
  className?: string
}

export function LagerOverviewToolbar({
  searchQuery,
  onSearchQueryChange,
  searchExpanded,
  onSearchExpandedChange,
  className,
}: LagerOverviewToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchExpanded) {
      inputRef.current?.focus()
    }
  }, [searchExpanded])

  function openSearch() {
    onSearchExpandedChange(true)
  }

  function closeSearch() {
    onSearchQueryChange("")
    onSearchExpandedChange(false)
  }

  function handleBlur() {
    if (!searchQuery.trim()) {
      onSearchExpandedChange(false)
    }
  }

  return (
    <div className={cn("flex shrink-0 items-center justify-end gap-1", className)}>
      <div
        className={cn(
          "flex items-center overflow-hidden transition-[width,opacity] duration-150 motion-reduce:transition-none",
          searchExpanded
            ? "w-full max-w-[11rem] opacity-100 sm:max-w-[13rem]"
            : "w-8 opacity-100"
        )}
      >
        {searchExpanded ? (
          <div className="flex w-full min-w-0 items-center gap-0.5">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault()
                    closeSearch()
                  }
                }}
                placeholder="Suchen…"
                className="h-8 pl-7 text-xs sm:h-9 sm:text-sm"
                aria-label="Artikel suchen"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 shrink-0 touch-manipulation"
              onClick={closeSearch}
              aria-label="Suche schließen"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 touch-manipulation"
            onClick={openSearch}
            aria-label="Artikel suchen"
          >
            <Search className="size-4" />
          </Button>
        )}
      </div>

      <LagerArtikelFormDialog triggerMode="icon" />
    </div>
  )
}
