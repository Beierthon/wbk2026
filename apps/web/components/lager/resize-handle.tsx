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
          ? "flex h-4 w-full cursor-row-resize items-center justify-center"
          : "flex w-3 cursor-col-resize items-center justify-center self-stretch",
        isDragging && "bg-muted/40",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "rounded-full bg-border transition-colors group-hover/handle:bg-foreground/30 group-active/handle:bg-foreground/40",
          isVertical ? "h-1 w-10" : "h-10 w-1"
        )}
      />
    </div>
  )
}
