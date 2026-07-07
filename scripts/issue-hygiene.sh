#!/usr/bin/env bash
# Remove stale workflow labels from closed issues and normalize open-issue state.
# Requires: gh CLI authenticated with issues:write on Beierthon/wbk2026

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-Beierthon/wbk2026}"
AGENT_LABEL="status: agent-in-arbeit"
STALE_CLOSED_LABELS=(
  "$AGENT_LABEL"
  "ready-to-implement"
  "needs-info"
  "ready-for-triage"
  "ready-to-triage"
)

usage() {
  cat <<'EOF'
Usage: ./scripts/issue-hygiene.sh <command>

Commands:
  cleanup-closed     Remove stale triage/agent labels from all closed issues
  audit              Print open issues and closed issues with stale labels
EOF
}

require_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "error: gh CLI is required" >&2
    exit 1
  fi
}

cmd_audit() {
  python3 <<'PY'
import json, subprocess

repo = subprocess.check_output(["bash", "-c", 'echo "${GITHUB_REPOSITORY:-Beierthon/wbk2026}"'], text=True).strip()
issues = json.loads(subprocess.check_output([
    "gh", "issue", "list", "--repo", repo, "--state", "all", "--limit", "200",
    "--json", "number,title,state,labels"
], text=True))

stale = {"status: agent-in-arbeit", "ready-to-implement", "needs-info", "ready-for-triage", "ready-to-triage"}
open_issues = [i for i in issues if i["state"] == "OPEN"]
closed_stale = [
    i for i in issues
    if i["state"] == "CLOSED" and any(l["name"] in stale for l in i["labels"])
]

print(f"Open issues: {len(open_issues)}")
for issue in sorted(open_issues, key=lambda x: x["number"]):
    labels = [l["name"] for l in issue["labels"]]
    print(f"  #{issue['number']}: {issue['title'][:72]}")
    print(f"    labels: {labels}")

print(f"\nClosed issues with stale labels: {len(closed_stale)}")
for issue in sorted(closed_stale, key=lambda x: x["number"]):
    labels = [l["name"] for l in issue["labels"] if l["name"] in stale]
    print(f"  #{issue['number']}: {labels}")
PY
}

cmd_cleanup_closed() {
  local issue label removed=0 failed=0

  while IFS= read -r issue; do
    [ -n "$issue" ] || continue
    for label in "${STALE_CLOSED_LABELS[@]}"; do
      if gh issue view "$issue" --repo "$REPO" --json labels -q '.labels[].name' | grep -qx "$label"; then
        if gh issue edit "$issue" --repo "$REPO" --remove-label "$label"; then
          echo "Removed '$label' from closed #$issue"
          removed=$((removed + 1))
        else
          echo "error: failed to remove '$label' from closed #$issue" >&2
          failed=$((failed + 1))
        fi
      fi
    done
  done < <(
    gh issue list \
      --repo "$REPO" \
      --state closed \
      --limit 200 \
      --json number,labels \
      --jq '.[] | select([.labels[].name] | any(. == "status: agent-in-arbeit" or . == "ready-to-implement" or . == "needs-info" or . == "ready-for-triage" or . == "ready-to-triage")) | .number'
  )

  if [ "$failed" -gt 0 ]; then
    echo "Cleanup finished with $failed failures ($removed label removals)." >&2
    exit 1
  fi

  echo "Cleanup complete ($removed label removals)."
}

main() {
  require_gh
  local command="${1:-audit}"
  case "$command" in
    audit) cmd_audit ;;
    cleanup-closed) cmd_cleanup_closed ;;
    -h | --help | help)
      usage
      ;;
    *)
      echo "error: unknown command '$command'" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
