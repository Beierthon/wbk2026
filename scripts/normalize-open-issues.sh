#!/usr/bin/env bash
# Normalize labels and post status comments on open issues after merges.

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-Beierthon/wbk2026}"
AGENT_LABEL="status: agent-in-arbeit"

require_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "error: gh CLI is required" >&2
    exit 1
  fi
}

issue_open() {
  gh issue view "$1" --repo "$REPO" --json state -q .state | grep -qx OPEN
}

normalize_102() {
  if ! issue_open 102; then
    return 0
  fi

  gh issue edit 102 --repo "$REPO" --remove-label "needs-info" || true
  gh issue comment 102 --repo "$REPO" --body "## Issue status after recent merges

**Baseline already on \`main\` via PR #146** (\`Closes #14\`, \`Closes #15\`): Geist tokens, app shell, project switcher, and designsystem docs.

**Remaining #102 scope** is tracked in open PR #156 (\`Closes #102\`): Vercel-inspired visual polish (black/white density, tighter radii, quieter chrome).

Labels updated: removed stale \`needs-info\` because implementation is in flight. \`status: agent-in-arbeit\` stays until PR #156 merges."
}

normalize_142() {
  if ! issue_open 142; then
    return 0
  fi

  gh issue edit 142 --repo "$REPO" --remove-label "$AGENT_LABEL" || true
  gh issue comment 142 --repo "$REPO" --body "## Issue status after recent merges

**Partially unblocked:** PR #147 merged the \`/roadmap\` terminplan system (Bauabschnitte, dependencies, cascade shifts, \`material_verzug\` as a manual shift reason, and \`material_liefertermin\` conflict detection when delivery is after section start).

**Still open for #142:** automatic rescheduling when required inventory quantity is insufficient (BOM quantities, availability formula, default lead time, and dependent-step cascade from stock checks). No merged PR implements this yet.

Labels updated: released \`status: agent-in-arbeit\` (no active PR). Kept \`needs-info\` until availability formula and replenishment rules are confirmed."
}

main() {
  require_gh
  normalize_102
  normalize_142
}

main "$@"
