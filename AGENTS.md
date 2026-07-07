<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cloud Agent Workflow

When multiple Cursor Cloud Agents work on this repository in parallel, use the GitHub label **`status: agent-in-arbeit`** to mark issues that are already claimed. Agents picking up new work should skip labeled issues.

## Selecting an issue

1. List open issues **without** `status: agent-in-arbeit`.
2. Skip issues that already have an open PR for the same scope.
3. Pick one clearly scoped issue and confirm it is still open.

```bash
gh issue list --repo Beierthon/wbk2026 --search 'is:issue is:open -label:"status: agent-in-arbeit"'
```

In the GitHub UI, filter open issues and exclude the `status: agent-in-arbeit` label.

## Claiming an issue

As soon as you start work on an issue — before creating a branch — add the label:

```bash
gh issue edit <NUMBER> --repo Beierthon/wbk2026 --add-label "status: agent-in-arbeit"
```

If helpful, leave a short comment with your branch name or agent link so humans can see who claimed it.

## Releasing the label

- **Work finished (PR merged or issue closed):** no action needed if the issue closes. If the issue stays open, remove the label.
- **Work abandoned:** remove the label so another agent can pick it up.

```bash
gh issue edit <NUMBER> --repo Beierthon/wbk2026 --remove-label "status: agent-in-arbeit"
```

## Label setup (maintainers)

Create the label once if it does not exist yet (matches the repo's German `status:` / `bereich:` naming):

```bash
gh label create "status: agent-in-arbeit" \
  --repo Beierthon/wbk2026 \
  --description "Von einem Cursor-Agent bearbeitet; nicht erneut aufgreifen" \
  --color "1d76db"
```
