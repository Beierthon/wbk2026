import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { RulerIcon } from "lucide-react"

export default function PlanungPage() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RulerIcon />
        </EmptyMedia>
        <EmptyTitle>Planungs-Dashboard folgt</EmptyTitle>
        <EmptyDescription>
          Planstaende, Versionen, Konflikte und Entscheidungen werden in Issue
          #3 umgesetzt.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
