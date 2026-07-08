"use client"

import { cn } from "@workspace/ui/lib/utils"

interface ResizeHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation: "horizontal" | "vertical"
  isDragging?: boolean
}

export function ResizeHandle({
  orientation,
  isDragging = false,
  className,
  ...props
}: ResizeHandleProps) {
  const isVertical = orientation === "vertical"

  return (
    <div
      role="separator"
      aria-orientation={isVertical ? "horizontal" : "vertical"}
      aria-label="Größe anpassen"
      className={cn(
        "group/handle touch-none shrink-0 select-none",
        isVertical
          ? "flex h-6 w-full cursor-row-resize items-center justify-center py-1"
          : "flex w-5 shrink-0 cursor-col-resize items-center justify-center self-stretch px-1",
        isDragging && "bg-muted/50",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "rounded-full bg-border transition-colors group-hover/handle:bg-foreground/35 group-active/handle:bg-foreground/45",
          isVertical ? "h-1 w-12" : "h-16 w-1"
        )}
      />
    </div>
  )
}
