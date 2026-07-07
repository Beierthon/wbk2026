---
name: pr-review
description: Review a pull request read-only and emit structured findings for a fixer agent.
---

# PR Review Skill

Review the pull request as a senior engineer. This phase is read-only.

## Inputs

Read:

- `pr-context.json`
- `linked-issues.json`
- `pr-checks.txt`
- `pr-feedback-since-last-review.md`

Also inspect the checked-out repository and PR diff. Do not edit, commit, or push.

## Review Priorities

Prioritize correctness, regressions, missing acceptance criteria, security issues, data loss, and missing tests. Keep style comments out unless they block maintainability or violate existing patterns.

If maintainer feedback exists in `pr-feedback-since-last-review.md`, address it first and classify each item as fixable, already satisfied, or human-needed.

Post one PR comment that includes:

- A short verdict.
- Findings ordered by severity, with file and line references when possible.
- Validation gaps.
- Which findings the next phase may fix automatically.

## Findings File

Write `pr-review-findings.json` in the current directory. Use this shape:

```json
{
  "verdict": "approve" | "changes_requested" | "needs_human",
  "findings": [
    {
      "title": "Short finding title",
      "severity": "critical" | "high" | "medium" | "low",
      "file": "path/to/file",
      "line": 1,
      "body": "What is wrong and why it matters.",
      "fixable": true
    }
  ],
  "validation_gaps": ["..."]
}
```

If there are no findings, write an empty `findings` array and post a concise approval-style comment.
