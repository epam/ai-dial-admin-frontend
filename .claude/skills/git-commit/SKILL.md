---
name: git-commit
model: claude-haiku-4-5-20251001
context: fork
effort: low
allowed-tools: Bash(git:*), Bash(gh:*), Bash(grep:*), Edit(.claude/reference/areas.md)
arguments: ticket area
argument-hint: "[ticket] [area]"
description: >
  Use this skill whenever the user wants to commit, push, or ship changes in a git repository.
  Triggers include: "commit changes", "push my changes", "ship it", "commit and push", "create a branch and commit",
  "make a PR", "open a pull request", "create draft PR", or any variation of committing/pushing work.
  Always use this skill when the user mentions committing — even casually — as it handles the full cycle:
  branch → add → commit → push → (optionally) PR, with Conventional Commits format and automatic area detection.
---

# Git Commit Skill

Full cycle: checkout new branch from `development` → stage → commit (Conventional Commits) → push → optional PR.

---

## Step 0 — Detect mode (new branch vs. update existing)

First figure out which mode you're in. This decides whether you create a branch/PR or just push to what already exists.

```bash
git rev-parse --abbrev-ref HEAD          # current branch
gh pr view --json number,url,state 2>/dev/null   # open PR for current branch (if any)
```

- **New-branch mode** — current branch is `development` (or another base branch), or there's no PR for it.
  Run the full cycle: Steps 1–6 as written (create branch → commit → push → optional PR).
- **Update-existing mode** — you're already on a feature branch **and** it has an open PR (or the user
  says "push to the existing PR" / "update my PR"). **Do not** create a new branch and **do not** run
  `gh pr create`. Stay on the current branch, then:
  1. Step 2 — review the changes.
  2. Step 4 — generate the commit message (reuse the existing PR's ticket; keep the same `area`/type style).
  3. Step 5 — **skip the `git checkout` lines**; just `git add` → `git commit` → `git push` to the current branch.
  4. Skip Step 6's `gh pr create`. Pushing updates the open PR automatically. Only refresh the PR body
     (`gh pr edit --body`) if the user asks or the description is now stale/missing.
  5. Step 7 — report the existing PR link, not a new one.

---

## Step 1 — Gather required context

Before doing anything, ensure you have:

- **Ticket number** — use the `ticket` argument if passed. Else look in conversation context (e.g. from
  OpenSpec explore, recent messages). If still not found, ask: _"What is the ticket number?"_
- **Area** — if the `area` argument is passed, use it directly in Step 3 (skip detection).
- **Draft PR?** — if the user said "draft" or "draft PR", note it for Step 5.

> This skill runs in a forked context (`context: fork`), so it does **not** see the main conversation.
> Prefer passing `ticket` (and optionally `area`) as arguments: `/git-commit 3642 Deployments/Images`.

---

## Step 2 — Understand the changes

```bash
git status
git diff HEAD
```

If there are no changes at all — report and stop.

---

## Step 3 — Determine `area`

Resolve the `area` with this 3-tier fallback (project-agnostic — works in any repo):

1. **`area` argument given** → use it verbatim. Done.
2. **Project defines an area taxonomy** → if `.claude/reference/areas.md` exists, read it and map the changed
   files to an area using the rules in that file (`Parent/Child` for one leaf, `Parent` for several
   under one parent, most-changed parent across many, technical area for infra/config).
3. **Neither** → infer a sensible area from the **top-level directory** of the changed files
   (e.g. most changes under `src/auth/**` → `auth`). For pure tooling/config with no feature home, use a
   technical area: `infra`, `config`, `api`.

### Step 3a — Self-extend `.claude/reference/areas.md` (only if the file exists)

If the resolved area is **not already listed** in `.claude/reference/areas.md`, append it so the taxonomy grows
over time. Do this for both a new arg-supplied area and a tier-3 inferred area.

Rules — be conservative, append-only, never rewrite or reorder existing rows:

1. **Confirm it's new** — `grep -F "<area>" .claude/reference/areas.md`. If the exact area string is already
   present, skip; do nothing.
2. **Pick the right section:**
   - New leaf under an existing parent (e.g. `Deployments/Foo`) → add a row to that parent's table.
   - New top-level feature with a route/component but no parent → add a row under
     **Cross-cutting feature areas**.
   - New non-UI concern → add a row under **Technical areas** with a short "Covers" note.
3. **Fill the evidence columns** from the actual change — the route slug (`app/[lang]/<slug>`) and/or
   the component folder (`src/components/<Folder>`) the change touched. Leave a cell as `—` only if it
   genuinely has none.
4. **Only one new row per run**, matching the single resolved area. Don't bulk-invent areas.
5. The edit is staged by `git add` in Step 5, so the taxonomy update ships **in the same commit** as the
   change that introduced it. Mention the added area in the Step 7 summary.

If `.claude/reference/areas.md` does **not** exist, skip 3a entirely (don't create it — that's a deliberate
project-setup choice, not something this skill bootstraps).

---

## Step 4 — Generate commit message

Format:
```
<type>(<area>): <short description> (Issue #<ticket>)
```

**Type selection** — pick the most accurate:

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Maintenance, deps, config, tooling |
| `refactor` | Restructuring without behavior change |
| `docs` | Documentation only |
| `test` | Tests only |
| `style` | Formatting, no logic change |

**Message rules:**
- Analyze the diff to understand *what* changed and *why*
- Keep the description concise and imperative (add, fix, update, remove, extract...)
- If ticket context is available (e.g. from OpenSpec), use it to improve accuracy

**Branch name** is derived from the commit message slug:
`feat/<short-slug>` — lowercase, hyphens only, no ticket number.

Example:
- Commit: `feat(Deployments/Images): add image version selector (Issue #42)`
- Branch: `feat/add-image-version-selector`

---

## Step 5 — Execute

```bash
# 1. Create branch from development
git checkout development
git checkout -b feat/<short-slug>

# 2. Stage all changes
git add .

# 3. Commit
git commit -m "<type>(<area>): <description> (Issue #<ticket>)"

# 4. Push
git push origin feat/<short-slug>
```

If push fails for any reason (no permissions, rejected, conflict) — **report the error with the full output and stop**. Do not attempt force push or rebase automatically.

---

## Step 6 — Pull Request (if requested)

If the user requested a PR or draft PR, generate the body using the repo's PR template
(`.github/pull_request_template.md`). **Always follow that template** — fill every placeholder,
never leave `<SHORT_DESCRIPTION>` or `<TICKET_ID>` unreplaced.

```markdown
**Description:**

<2-4 sentences: what changed and why. Use the diff + ticket context. Explain the *why*, not just the *what*.>

Issues:

- Issue #<ticket>

## Key Changes
- [path/to/file.tsx](<github-file-link>) — short description
- [path/to/file.tsx](<github-file-link>) — short description

## New Components
<List of newly created React components or reusable modules with a one-line description each.>
<Omit this section entirely if no new components were added.>

## Breaking Changes
<Describe any breaking changes to APIs, props, or component interfaces.>
<Omit this section entirely if there are no breaking changes.>


**Checklist:**

- [x] the pull request name complies with [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [x] the pull request name ends with `(Issue #<ticket>)` (comma-separated list of issues)
```

Rules for filling the template:
- **Description**: required — always write a real summary, even for small chores. Explain the *why*,
  not just the *what*; use ticket title/description for context.
- **Issues**: one `- Issue #<ticket>` line per ticket. If there is genuinely no ticket, **remove the
  whole `Issues:` block** and leave the second checklist item **unchecked** (`[ ]`), since the title
  can't end with `(Issue #…)`.
- **Summary**: explain the *why*, not just the *what*; use ticket description for context.
- **Key Changes**: most impactful files only (max ~10); skip trivial files like formatting-only changes.
- **New Components**: newly created React components or shared modules only. Omit the section if none.
- **Breaking Changes**: only if interfaces, props, or contracts changed non-backward-compatibly;
  otherwise omit the section.
- **Checklist**: tick `[x]` the boxes this skill actually satisfies — the title is Conventional Commits
  (always checked) and ends with `(Issue #<ticket>)` (checked only when a ticket exists).

Then create the PR:

```bash
# Regular PR
gh pr create \
  --base development \
  --head feat/<short-slug> \
  --title "<type>(<area>): <description> (Issue #<ticket>)" \
  --body "<generated body>"

# Draft PR (if user said "draft")
gh pr create \
  --base development \
  --head feat/<short-slug> \
  --title "<type>(<area>): <description> (Issue #<ticket>)" \
  --body "<generated body>" \
  --draft
```

If `gh` CLI is not available — provide the GitHub compare URL for manual PR creation:
```
https://github.com/<org>/<repo>/compare/development...feat/<short-slug>
```

---

## Step 7 — Summary

Always finish with a concise confirmation:

```
Branch:  feat/<short-slug>
Commit:  <type>(<area>): <description> (Issue #<ticket>)
Push:    ✅ succeeded  /  ❌ failed — <reason>
PR:      <link> (created)  /  <link> (updated existing)  /  skipped
```
