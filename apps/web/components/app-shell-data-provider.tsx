"use client"

import { createContext, useContext } from "react"

import type { AppShellData } from "@/lib/data/app-shell-data"

const AppShellDataContext = createContext<AppShellData | null>(null)

export function AppShellDataProvider({
  value,
  children,
}: {
  value: AppShellData
  children: React.ReactNode
}) {
  return (
    <AppShellDataContext.Provider value={value}>
      {children}
    </AppShellDataContext.Provider>
  )
}

export function useAppShellData() {
  const value = useContext(AppShellDataContext)
  if (!value) {
    throw new Error("useAppShellData must be used within AppShellDataProvider")
  }
  return value
}
