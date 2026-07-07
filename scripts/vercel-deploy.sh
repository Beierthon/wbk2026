#!/usr/bin/env bash
# Build and deploy this monorepo to Vercel via the CLI after author metadata is set.

set -euo pipefail

ENVIRONMENT="${VERCEL_ENVIRONMENT:-preview}"
ROOT_DIR="${VERCEL_ROOT_DIRECTORY:-apps/web}"
TOKEN="${VERCEL_TOKEN:-}"

usage() {
  cat <<EOF
Usage: ./scripts/vercel-deploy.sh [production|preview]

Requires:
  VERCEL_TOKEN
  VERCEL_ORG_ID
  VERCEL_PROJECT_ID

Optional:
  VERCEL_ROOT_DIRECTORY   App root (default: apps/web)
  VERCEL_ENVIRONMENT      production | preview
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: $1 is required" >&2
    exit 1
  fi
}

require_secrets() {
  if [ -z "$TOKEN" ]; then
    echo "error: VERCEL_TOKEN is not set" >&2
    exit 1
  fi
  if [ -z "${VERCEL_ORG_ID:-}" ] || [ -z "${VERCEL_PROJECT_ID:-}" ]; then
    echo "error: VERCEL_ORG_ID and VERCEL_PROJECT_ID must be set" >&2
    exit 1
  fi
  if [ ! -d "$ROOT_DIR" ]; then
    echo "error: VERCEL_ROOT_DIRECTORY '$ROOT_DIR' does not exist" >&2
    exit 1
  fi
}

deploy() {
  local is_prod=false
  if [ "$ENVIRONMENT" = "production" ]; then
    is_prod=true
  fi

  require_cmd vercel
  require_secrets

  echo "Deploying ${ENVIRONMENT} from ${ROOT_DIR}..."

  if [ "$is_prod" = true ]; then
    vercel pull --yes --environment=production --token="$TOKEN" --cwd "$ROOT_DIR"
    vercel build --prod --token="$TOKEN" --cwd "$ROOT_DIR"
    vercel deploy --prebuilt --prod --token="$TOKEN" --cwd "$ROOT_DIR"
  else
    vercel pull --yes --environment=preview --token="$TOKEN" --cwd "$ROOT_DIR"
    vercel build --token="$TOKEN" --cwd "$ROOT_DIR"
    vercel deploy --prebuilt --token="$TOKEN" --cwd "$ROOT_DIR"
  fi
}

main() {
  case "${1:-}" in
    -h | --help | help)
      usage
      exit 0
      ;;
    production | preview | "")
      if [ -n "${1:-}" ]; then
        ENVIRONMENT="$1"
      fi
      deploy
      ;;
    *)
      echo "error: unknown environment '$1'" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
