import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Building2Icon } from "lucide-react"

export default function BetriebPage() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Building2Icon />
        </EmptyMedia>
        <EmptyTitle>Betreiber-Dashboard folgt</EmptyTitle>
        <EmptyDescription>
          Assets, Uebergabe und Wartungspunkte werden in Issue #6 umgesetzt.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
