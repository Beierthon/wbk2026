import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { HardHatIcon } from "lucide-react"

export default function BauPage() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HardHatIcon />
        </EmptyMedia>
        <EmptyTitle>Bau-Dashboard folgt</EmptyTitle>
        <EmptyDescription>
          Material, Bestellungen und Baustellenfeedback werden in Issue #4
          umgesetzt.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
