#!/usr/bin/env bash
# Trigger a Vercel Deploy Hook (Settings → Git → Deploy Hooks).
# Does not require VERCEL_TOKEN / ORG_ID / PROJECT_ID and bypasses git-author checks.

set -euo pipefail

HOOK_URL="${VERCEL_DEPLOY_HOOK_URL:-}"

usage() {
  cat <<EOF
Usage: ./scripts/vercel-trigger-hook.sh

Environment:
  VERCEL_DEPLOY_HOOK_URL   Deploy hook URL from Vercel project settings
EOF
}

main() {
  case "${1:-}" in
    -h | --help | help)
      usage
      exit 0
      ;;
  esac

  if [ -z "$HOOK_URL" ]; then
    echo "error: VERCEL_DEPLOY_HOOK_URL is not set" >&2
    exit 1
  fi

  echo "Triggering Vercel deploy hook..."
  curl --fail --silent --show-error --request POST "$HOOK_URL"
  echo
  echo "Deploy hook triggered."
}

main "$@"
