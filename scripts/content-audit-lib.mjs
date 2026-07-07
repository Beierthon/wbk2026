/** Case-insensitive patterns for the phrase and close variants (Issue #140). */
export const FORBIDDEN_PATTERNS = [
  /beier\s+leck\s+eier/i,
  /leck\s+eier/i,
]

export function findViolationsForTest(content) {
  const hits = new Set()
  for (const pattern of FORBIDDEN_PATTERNS) {
    const match = content.match(pattern)
    if (match) {
      hits.add(match[0])
    }
  }
  return [...hits]
}
