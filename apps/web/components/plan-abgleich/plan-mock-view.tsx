import type { PlanAbweichungBewertung, PlanAnnotation } from "@workspace/domain"

export function PlanMockView({
  annotations,
  selectedId,
  bewertungen,
  onSelect,
  planLabel,
}: {
  annotations: PlanAnnotation[]
  selectedId?: string
  bewertungen: Record<string, PlanAbweichungBewertung | undefined>
  onSelect?: (id: string) => void
  planLabel: string
}) {
  return (
    <svg viewBox="0 0 640 480" className="h-full w-full rounded-xl border" role="img">
      <rect width="640" height="480" fill="#f8fafc" />
      <text x="56" y="40" fontSize="14" fontWeight="600">{planLabel}</text>
      {annotations.map((a) => {
        const x = (a.planPosition.x / 100) * 640
        const y = (a.planPosition.y / 100) * 480
        const fill =
          bewertungen[a.id] === "passt"
            ? "#059669"
            : bewertungen[a.id] === "abweichung"
              ? "#dc2626"
              : bewertungen[a.id] === "unklar"
                ? "#d97706"
                : "#2563eb"
        return (
          <g key={a.id} onClick={onSelect ? () => onSelect(a.id) : undefined} className={onSelect ? "cursor-pointer" : undefined}>
            <circle cx={x} cy={y} r={selectedId === a.id ? 14 : 10} fill={fill} stroke="#fff" strokeWidth={2} />
            <text x={x + 16} y={y + 4} fontSize="11">{a.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
