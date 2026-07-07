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
