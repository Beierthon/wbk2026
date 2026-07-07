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

GIT_SEQUENCE_EDITOR=true git rebase "$merge_base" --exec \
  'git commit --amend --no-edit --reset-author --allow-empty'

echo "Rewrote commits on $(git rev-parse --abbrev-ref HEAD) to ${NAME} <${EMAIL}>"
