"use client"

import { useEffect } from "react"

export function DesignFontLoader({ href }: { href: string }) {
  useEffect(() => {
    const id = `design-font-${href}`
    if (document.getElementById(id)) {
      return
    }

    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = href
    document.head.appendChild(link)

    return () => {
      link.remove()
    }
  }, [href])

  return null
}
