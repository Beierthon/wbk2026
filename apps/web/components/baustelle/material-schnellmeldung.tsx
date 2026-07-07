"use client"

import type { MaterialSchnellArt } from "@workspace/domain"
import { Button } from "@workspace/ui/components/button"
import { useTransition } from "react"
import { toast } from "sonner"

import { meldeMaterialSchnellAction } from "@/lib/actions/project-actions"

interface MaterialOption {
  id: string
  name: string
}

const SCHNELL_ARTEN: { art: MaterialSchnellArt; label: string }[] = [
  { art: "bestand_niedrig", label: "Low stock" },
  { art: "geliefert", label: "Delivered" },
  { art: "ersatz_noetig", label: "Replacement needed" },
]

export function MaterialSchnellmeldung({
  materialien,
}: {
  materialien: MaterialOption[]
}) {
  const [pending, startTransition] = useTransition()

  if (materialien.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No materials available for quick reports.
      </p>
    )
  }

  function melden(materialId: string, art: MaterialSchnellArt, label: string) {
    const formData = new FormData()
    formData.set("materialId", materialId)
    formData.set("art", art)
    formData.set("geraet", "mobil")

    startTransition(async () => {
      try {
        await meldeMaterialSchnellAction(formData)
        toast.success(`${label} reported.`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Report failed.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {materialien.map((material) => (
        <div key={material.id} className="flex flex-col gap-2">
          <p className="text-sm font-medium">{material.name}</p>
          <div className="grid grid-cols-1 gap-2">
            {SCHNELL_ARTEN.map((item) => (
              <Button
                key={`${material.id}-${item.art}`}
                type="button"
                variant="outline"
                disabled={pending}
                className="h-14 justify-center rounded-lg text-base font-medium"
                onClick={() => melden(material.id, item.art, item.label)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
