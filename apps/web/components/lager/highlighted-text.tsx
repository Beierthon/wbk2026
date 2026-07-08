function findMatchIndex(text: string, query: string): number {
  if (!query) return -1
  return text.toLowerCase().indexOf(query.toLowerCase())
}

export function HighlightedText({
  text,
  query,
  className,
}: {
  text: string
  query: string
  className?: string
}) {
  const matchIndex = findMatchIndex(text, query)

  if (matchIndex === -1) {
    return <span className={className}>{text}</span>
  }

  const matchLength = query.length

  return (
    <span className={className}>
      {text.slice(0, matchIndex)}
      <mark className="rounded-sm bg-primary/15 font-semibold text-foreground not-italic">
        {text.slice(matchIndex, matchIndex + matchLength)}
      </mark>
      {text.slice(matchIndex + matchLength)}
    </span>
  )
}

export function highlightedTextMatches(text: string, query: string): boolean {
  return findMatchIndex(text, query) !== -1
}
