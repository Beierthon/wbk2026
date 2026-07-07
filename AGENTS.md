<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cloud Agent Workflow

When multiple Cursor Cloud Agents work on this repository in parallel, mark claimed GitHub issues with the label **`status: agent-in-arbeit`**. Other agents must skip labeled issues.

The label is defined in `.github/labels.yml` and created automatically by the **Sync labels** workflow when changes land on `main`.

## Selecting an issue

1. List open issues **without** `status: agent-in-arbeit`.
2. Skip issues that already have an open PR for the same scope.
3. Pick one clearly scoped issue and confirm it is still open.

```bash
./scripts/agent-issue.sh list
# or:
gh issue list --repo Beierthon/wbk2026 --search 'is:issue is:open -label:"status: agent-in-arbeit"'
```

In the GitHub UI, filter open issues and exclude the `status: agent-in-arbeit` label.

## Claiming an issue (required)

**Before creating a branch or writing code**, claim the issue. This is mandatory — do not skip it.

```bash
export CURSOR_AGENT_URL="https://cursor.com/agents/<your-bc-id>"   # optional
export BRANCH_NAME="cursor/my-feature-9994"                         # optional
./scripts/agent-issue.sh claim <NUMBER>
```

Equivalent manual command:

```bash
gh issue edit <NUMBER> --repo Beierthon/wbk2026 --add-label "status: agent-in-arbeit"
```

If `gh` fails with a missing label, merge the label-sync PR first or ask a maintainer to run the **Sync labels** workflow.

### Backup: automatic claim from PRs

When a PR is opened and its title or body references an issue (`#12`, `Closes #12`, `issue #12`, …), the **Agent issue claim** workflow adds the label automatically. Still prefer claiming **before** you start work so parallel agents do not pick the same issue.

## Releasing the label

- **Work finished (PR merged or issue closed):** no action needed if the issue closes. If the issue stays open, release it.
- **Work abandoned:** release the label so another agent can pick it up.

```bash
./scripts/agent-issue.sh release <NUMBER>
```

## Label setup (maintainers)

Labels are managed in `.github/labels.yml`. After editing, push to `main` or run the **Sync labels** workflow manually.

To claim or release manually from the Actions tab, use **Agent issue claim** → **Run workflow**.
