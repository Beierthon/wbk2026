"use client"

import type { TerminplanSzenario } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"

import { wechsleSzenarioAction } from "@/lib/actions/terminplan-actions"

interface SzenarioSwitcherProps {
  szenarien: TerminplanSzenario[]
  aktivesSzenarioId: string
}

export function SzenarioSwitcher({
  szenarien,
  aktivesSzenarioId,
}: SzenarioSwitcherProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {szenarien.map((szenario) => (
        <form key={szenario.id} action={wechsleSzenarioAction}>
          <input type="hidden" name="szenarioId" value={szenario.id} />
          <Button
            type="submit"
            size="sm"
            variant={szenario.id === aktivesSzenarioId ? "default" : "outline"}
          >
            {szenario.name}
          </Button>
        </form>
      ))}
    </div>
  )
}
