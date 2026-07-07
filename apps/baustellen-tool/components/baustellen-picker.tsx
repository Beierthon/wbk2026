"use client"

import { useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { setActiveBaustelle } from "@/app/actions/baustelle"
import type { Baustelle } from "@/lib/domain/schemas"

export function BaustellenPicker({
  baustellen,
  currentId,
}: {
  baustellen: Baustelle[]
  currentId: string
}) {
  const [isPending, startTransition] = useTransition()
  return (
    <Select
      value={currentId}
      onValueChange={(id) => {
        if (!id) return
        startTransition(async () => {
          await setActiveBaustelle(id)
        })
      }}
      disabled={isPending}
    >
      <SelectTrigger className="min-w-[260px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {baustellen.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
