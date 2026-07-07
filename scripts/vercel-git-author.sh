#!/usr/bin/env bash
# Rewrite git author/committer on the CI checkout so Vercel team deployments pass
# the "git author must have access" check. Only affects the ephemeral runner
# checkout — repository history is not modified.

set -euo pipefail

TARGET_NAME="${VERCEL_DEPLOYER_NAME:-${GIT_AUTHOR_TARGET_NAME:-Kevin Beier}}"
TARGET_EMAIL="${VERCEL_DEPLOYER_EMAIL:-${GIT_AUTHOR_TARGET_EMAIL:-hey@kevinbeier.com}}"
MODE="${VERCEL_AUTHOR_MODE:-head}"

usage() {
  cat <<EOF
Usage: ./scripts/vercel-git-author.sh [head|range]

Rewrites commit metadata on the checked-out branch for Vercel CLI deploys.

Modes:
  head   Amend HEAD only (default, fast)
  range  Rebase branch commits since merge-base (still local only, no push)

Environment:
  VERCEL_DEPLOYER_NAME     Vercel team member name (default: Kevin Beier)
  VERCEL_DEPLOYER_EMAIL    Vercel team member email (default: hey@kevinbeier.com)
  VERCEL_AUTHOR_MODE       head | range (default: head)
  BASE_REF                 Base branch for range mode (default: main)
EOF
}

require_git() {
  if ! command -v git >/dev/null 2>&1; then
    echo "error: git is required" >&2
    exit 1
  fi
}

strip_co_authored_trailers() {
  git log -1 --pretty=%B | sed "/^[Cc]o-[Aa]uthored-[Bb]y:/Id" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}'
}

rewrite_head() {
  git config user.name "$TARGET_NAME"
  git config user.email "$TARGET_EMAIL"

  local msg
  msg="$(strip_co_authored_trailers)"
  git commit --amend --no-edit --reset-author --no-verify --allow-empty -m "$msg"

  echo "HEAD author set to ${TARGET_NAME} <${TARGET_EMAIL}> (ephemeral checkout only)."
}

resolve_base_ref() {
  local base_ref="${BASE_REF:-main}"
  if git show-ref --verify --quiet "refs/remotes/origin/${base_ref}"; then
    echo "origin/${base_ref}"
    return
  fi
  if git show-ref --verify --quiet "refs/heads/${base_ref}"; then
    echo "${base_ref}"
    return
  fi
  echo "error: base ref '${base_ref}' not found" >&2
  exit 1
}

rewrite_range() {
  local base_ref merge_base

  base_ref="$(resolve_base_ref)"
  merge_base="$(git merge-base "$base_ref" HEAD)"

  if [ "$merge_base" = "$(git rev-parse HEAD)" ]; then
    rewrite_head
    return
  fi

  git config user.name "$TARGET_NAME"
  git config user.email "$TARGET_EMAIL"

  GIT_SEQUENCE_EDITOR=true git rebase "$merge_base" --exec '
    msg="$(git log -1 --pretty=%B | sed "/^[Cc]o-[Aa]uthored-[Bb]y:/Id" | sed -e :a -e "/^\n*$/{$d;N;ba}" -e "}" )"
    git commit --amend --no-edit --reset-author --no-verify --allow-empty -m "$msg"
  '

  echo "Branch commits since ${base_ref} rewritten to ${TARGET_NAME} <${TARGET_EMAIL}> (ephemeral checkout only)."
}

main() {
  local mode="${1:-$MODE}"

  case "$mode" in
    -h | --help | help)
      usage
      exit 0
      ;;
    head)
      require_git
      rewrite_head
      ;;
    range)
      require_git
      rewrite_range
      ;;
    *)
      echo "error: unknown mode '$mode' (expected head or range)" >&2
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
