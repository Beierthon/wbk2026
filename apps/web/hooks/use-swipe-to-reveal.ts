"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const REVEAL_WIDTH = 88
const OPEN_THRESHOLD = 44
const AXIS_LOCK_PX = 8

export function useSwipeToReveal() {
  const [offset, setOffset] = useState(0)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startOffset: 0,
    axis: null as "x" | "y" | null,
  })

  const close = useCallback(() => {
    setOpen(false)
    offsetRef.current = 0
    setOffset(0)
  }, [])

  const snap = useCallback((value: number) => {
    const shouldOpen = value > OPEN_THRESHOLD
    const next = shouldOpen ? REVEAL_WIDTH : 0
    setOpen(shouldOpen)
    offsetRef.current = next
    setOffset(next)
    return shouldOpen
  }, [])

  useEffect(() => {
    const node = rootRef.current
    if (!node) {
      return
    }

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) {
        return
      }

      dragRef.current = {
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
        startOffset: open ? REVEAL_WIDTH : 0,
        axis: null,
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!dragRef.current.active) {
        return
      }

      const touch = event.touches[0]
      if (!touch) {
        return
      }

      const dx = touch.clientX - dragRef.current.startX
      const dy = touch.clientY - dragRef.current.startY

      if (!dragRef.current.axis) {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) {
          return
        }

        dragRef.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
      }

      if (dragRef.current.axis !== "x") {
        return
      }

      event.preventDefault()
      const next = Math.max(
        0,
        Math.min(REVEAL_WIDTH, dragRef.current.startOffset - dx)
      )
      offsetRef.current = next
      setOffset(next)
    }

    const onTouchEnd = () => {
      if (!dragRef.current.active) {
        return
      }

      dragRef.current.active = false
      if (dragRef.current.axis === "x") {
        snap(offsetRef.current)
      }
      dragRef.current.axis = null
    }

    node.addEventListener("touchstart", onTouchStart, { passive: true })
    node.addEventListener("touchmove", onTouchMove, { passive: false })
    node.addEventListener("touchend", onTouchEnd)
    node.addEventListener("touchcancel", onTouchEnd)

    return () => {
      node.removeEventListener("touchstart", onTouchStart)
      node.removeEventListener("touchmove", onTouchMove)
      node.removeEventListener("touchend", onTouchEnd)
      node.removeEventListener("touchcancel", onTouchEnd)
    }
  }, [open, snap])

  return {
    rootRef,
    offset,
    open,
    close,
    revealWidth: REVEAL_WIDTH,
  }
}
