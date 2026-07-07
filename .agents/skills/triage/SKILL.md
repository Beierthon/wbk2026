---
name: triage
description: Read issue context and decide whether an issue is ready for automated implementation.
---

# Triage Skill

You are triaging a GitHub issue for an automated implementation pipeline.

## Inputs

Read these files from the current working directory:

- `issue-context.json`: the triggering issue, labels, and comments.
- `labels-context.json`: repository label names and descriptions.
- `open-issues-context.json`: recent open issues for duplicate and related-work checks.

Do not edit files, commit, push, or change GitHub state directly. The workflow applies your result.

## Decision Rules

Return `ready-to-implement` only when the issue is actionable, scoped, and has enough detail for an implementation agent to make the smallest cohesive change without guessing product intent.

Return `needs-info` when the issue is missing expected behavior, acceptance criteria, reproduction steps, affected area, or when it appears blocked by a duplicate or prior issue that should be resolved first.

Use `open-issues-context.json` to identify likely duplicates, related issues, and previous decisions. Mention issue numbers when relevant.

Prefer precise, useful comments over long summaries. If the issue is ready, restate the expected implementation outcome and any constraints the implementer must preserve. If it needs information, ask concrete questions.

## Output

Your final response must include exactly one JSON object with this shape:

```json
{
  "state": "ready" | "needs_info",
  "label": "ready-to-implement" | "needs-info",
  "remove_labels": ["ready-for-triage", "ready-to-triage", "needs-info", "ready-to-implement"],
  "comment": "Markdown comment to post on the issue."
}
```

Set `remove_labels` to any stale triage labels that should be removed before the new label is applied.
