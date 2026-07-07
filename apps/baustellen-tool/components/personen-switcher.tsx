"use client"

import { useTransition } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { setShopfloorPerson } from "@/app/actions/shopfloor"
import type { Person } from "@/lib/domain/schemas"

export function PersonenSwitcher({
  personen,
  currentId,
}: {
  personen: Person[]
  currentId: string | null
}) {
  const [isPending, startTransition] = useTransition()
  return (
    <Select
      value={currentId ?? undefined}
      onValueChange={(id) => {
        if (!id) return
        startTransition(async () => {
          await setShopfloorPerson(id)
        })
      }}
      disabled={isPending}
    >
      <SelectTrigger className="mt-1 w-full">
        <SelectValue placeholder="Person wählen" />
      </SelectTrigger>
      <SelectContent>
        {personen.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
