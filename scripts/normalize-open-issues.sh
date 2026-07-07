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
  gh issue edit 142 --repo "$REPO" --remove-label "needs-info" || true
  gh issue comment 142 --repo "$REPO" --body "## Issue status after recent merges

**Foundation:** PR #147 delivered \`/roadmap\`, Bauabschnitte, dependencies, and cascade shifts.

**Implemented in PR for #142:** inventory-driven auto-rescheduling — \`BauabschnittMaterialbedarf\`, stock availability checks (\`lager - reserviert\`), replenishment via open \`Bestellung.liefertermin\` (fallback 14-day lead time), automatic kaskade shifts with \`material_verzug\` reason, roadmap UI panel, and domain tests.

Labels updated: removed \`needs-info\` once replenishment rules are codified in domain."
}

main() {
  require_gh
  normalize_102
  normalize_142
}

main "$@"
