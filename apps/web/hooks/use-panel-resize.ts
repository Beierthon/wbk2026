"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

type ResizeAxis = "x" | "y"

interface UsePanelResizeOptions {
  axis: ResizeAxis
  initial: number
  min: number
  max: number
  /** Drag up/right increases size when true (dock height from bottom). */
  invert?: boolean
  storageKey?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function readStoredSize(key: string | undefined, fallback: number) {
  if (!key || typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function usePanelResize({
  axis,
  initial,
  min,
  max,
  invert = false,
  storageKey,
}: UsePanelResizeOptions) {
  const [size, setSize] = useState(initial)
  const [isDragging, setIsDragging] = useState(false)
  const sizeRef = useRef(initial)
  const dragRef = useRef<{ start: number; startSize: number } | null>(null)

  useEffect(() => {
    const stored = readStoredSize(storageKey, initial)
    const next = clamp(stored, min, max)
    sizeRef.current = next
    setSize(next)
  }, [initial, max, min, storageKey])

  useEffect(() => {
    setSize((current) => {
      const next = clamp(current, min, max)
      sizeRef.current = next
      return next
    })
  }, [max, min])

  const persist = useCallback(
    (value: number) => {
      if (!storageKey) return
      try {
        localStorage.setItem(storageKey, String(Math.round(value)))
      } catch {
        // Quota or private browsing
      }
    },
    [storageKey]
  )

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const start = axis === "x" ? event.clientX : event.clientY
      dragRef.current = { start, startSize: sizeRef.current }
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [axis]
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return
      const current = axis === "x" ? event.clientX : event.clientY
      let delta = current - dragRef.current.start
      if (invert) delta = -delta
      const next = clamp(dragRef.current.startSize + delta, min, max)
      sizeRef.current = next
      setSize(next)
    },
    [axis, invert, min, max]
  )

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return
      dragRef.current = null
      setIsDragging(false)
      persist(sizeRef.current)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    },
    [persist]
  )

  return {
    size,
    isDragging,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerEnd: endDrag,
      onPointerCancel: endDrag,
    },
  }
}
