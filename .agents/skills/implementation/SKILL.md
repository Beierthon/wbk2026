---
name: implementation
description: Implement a ready GitHub issue, validate it, open a pull request, and report back.
---

# Implementation Skill

You implement one GitHub issue that has been marked ready to implement.

## Required Flow

1. Read `AGENTS.md` before making changes. If you edit Next.js code, read the relevant guide in `node_modules/next/dist/docs/` first.
2. Fetch the full issue and comments with `gh issue view`.
3. Post a brief progress comment on the issue before making substantive changes.
4. Inspect the codebase and choose the smallest cohesive implementation that satisfies the issue.
5. Create a branch named `agent/issue-<number>-<short-slug>`.
6. Make the change, preserving existing architecture and style.
7. Run the most relevant validation commands. Prefer `pnpm lint`, `pnpm typecheck`, and `pnpm build` when affected.
8. Commit only the intended files using the configured git author.
9. Push the branch and open a pull request.
10. If the implementation fully resolves the issue, include `Closes #<number>` in the PR body.
11. Post a final issue comment only after the PR exists. Include the PR URL, validation performed, and any residual risk.

## Guardrails

- Do not add co-authored-by trailers unless explicitly asked.
- Do not make broad refactors unless required by the issue.
- Do not close the issue directly.
- If required information is missing, post a clear blocker comment and stop without opening a speculative PR.
- If validation cannot run, explain why in both the PR body and issue comment.

## PR Body

Use this structure:

```md
## Summary

- ...

## Testing

- [x] `command`

## Risks

- ...

Closes #<number>
```
