#!/usr/bin/env bash
set -euo pipefail

NAME="${GIT_AUTHOR_NAME:-Kevin Beier}"
EMAIL="${GIT_AUTHOR_EMAIL:-hey@kevinbeier.com}"
BASE="${BASE_REF:-main}"

git config user.name "$NAME"
git config user.email "$EMAIL"

if git show-ref --verify --quiet "refs/remotes/origin/${BASE}"; then
  base="origin/${BASE}"
else
  base="$BASE"
fi

merge_base="$(git merge-base "$base" HEAD)"
if [ "$merge_base" = "$(git rev-parse HEAD)" ]; then
  echo "Nothing to rewrite."
  exit 0
fi

range="${merge_base}..HEAD"
commits_count="$(git rev-list --count "$range")"
parent="$(git rev-parse HEAD^ 2>/dev/null || true)"

# Fork branches often track an upstream tip while origin/main is stale. Rewriting
# the full stale..HEAD range would replay dozens of already-merged commits.
if [ "$commits_count" -gt 10 ] && [ -n "$parent" ]; then
  tip_count="$(git rev-list --count "${parent}..HEAD")"
  if [ "$tip_count" -eq 1 ]; then
    echo "Narrowing rewrite to tip commit only (${parent}..HEAD)."
    merge_base="$parent"
    range="${parent}..HEAD"
  fi
fi

target_ident="${NAME} <${EMAIL}>"

if ! git log --format='%an <%ae>%n%cn <%ce>' "$range" | grep -Fvx "$target_ident" >/dev/null; then
  echo "Commit authors already match ${target_ident}."
  exit 0
fi

before_tree="$(git rev-parse HEAD^{tree})"

export TARGET_AUTHOR_NAME="$NAME"
export TARGET_AUTHOR_EMAIL="$EMAIL"

git filter-branch -f --env-filter '
export GIT_AUTHOR_NAME="$TARGET_AUTHOR_NAME"
export GIT_AUTHOR_EMAIL="$TARGET_AUTHOR_EMAIL"
export GIT_COMMITTER_NAME="$TARGET_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$TARGET_AUTHOR_EMAIL"
' "$range"

after_tree="$(git rev-parse HEAD^{tree})"
if [ "$before_tree" != "$after_tree" ]; then
  echo "Author rewrite changed the final tree; refusing to continue." >&2
  exit 1
fi

echo "Rewrote commits on $(git rev-parse --abbrev-ref HEAD) to ${NAME} <${EMAIL}>"
