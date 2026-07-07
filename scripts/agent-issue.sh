#!/usr/bin/env bash
# Claim or release GitHub issues for Cursor Cloud Agents.
# Requires: gh CLI authenticated with issues:write on Beierthon/wbk2026

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-Beierthon/wbk2026}"
LABEL="status: agent-in-arbeit"

usage() {
  cat <<'EOF'
Usage: ./scripts/agent-issue.sh <command> [issue_number]

Commands:
  list              List open issues without status: agent-in-arbeit
  claim <number>    Mark issue as claimed (label + comment)
  release <number>  Remove the agent-in-arbeit label

Environment (optional):
  BRANCH_NAME       Included in the claim comment
  CURSOR_AGENT_URL  Included in the claim comment
EOF
}

require_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "error: gh CLI is required" >&2
    exit 1
  fi
}

cmd_list() {
  gh issue list \
    --repo "$REPO" \
    --search "is:issue is:open -label:\"$LABEL\"" \
    --json number,title,labels \
    --limit 50
}

issue_has_label() {
  local issue="$1"
  gh issue view "$issue" --repo "$REPO" --json labels -q '.labels[].name' | grep -qx "$LABEL"
}

cmd_claim() {
  local issue="$1"

  if issue_has_label "$issue"; then
    echo "error: issue #$issue already has label '$LABEL'" >&2
    exit 1
  fi

  gh issue edit "$issue" --repo "$REPO" --add-label "$LABEL"

  local comment="🤖 Von einem Cursor Cloud Agent übernommen (Label \`$LABEL\`)."
  if [ -n "${BRANCH_NAME:-}" ]; then
    comment="$comment Branch: \`${BRANCH_NAME}\`."
  fi
  if [ -n "${CURSOR_AGENT_URL:-}" ]; then
    comment="$comment Agent: ${CURSOR_AGENT_URL}"
  fi

  gh issue comment "$issue" --repo "$REPO" --body "$comment"
  echo "Claimed issue #$issue"
}

cmd_release() {
  local issue="$1"
  gh issue edit "$issue" --repo "$REPO" --remove-label "$LABEL" || true
  echo "Released issue #$issue"
}

main() {
  require_gh

  local command="${1:-}"
  case "$command" in
    list)
      cmd_list
      ;;
    claim)
      [ "${2:-}" ] || { usage >&2; exit 1; }
      cmd_claim "$2"
      ;;
    release)
      [ "${2:-}" ] || { usage >&2; exit 1; }
      cmd_release "$2"
      ;;
    -h | --help | help | "")
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
