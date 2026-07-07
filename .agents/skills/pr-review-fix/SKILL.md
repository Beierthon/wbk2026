---
name: pr-review-fix
description: Apply fixable review findings to an existing same-repository pull request.
---

# PR Review Fix Skill

You are fixing review findings on an existing pull request branch.

## Required Flow

1. Read `pr-review-findings.json`.
2. Read `pr-feedback-since-last-review.md`.
3. Apply only findings where `fixable` is `true`.
4. Preserve the PR's intended scope and avoid unrelated cleanup.
5. Run relevant validation commands for the files changed.
6. If files changed, commit and push to the current branch.
7. Post a PR comment summarizing fixed findings, skipped findings, and validation.

## Guardrails

- Do not rewrite branch history.
- Do not force push.
- Do not address findings marked `fixable: false`; call them out as human-needed.
- If there are no fixable findings, post a short comment and leave the branch unchanged.
- Do not commit `pr-review-findings.json` or generated context files.
