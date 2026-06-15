---
name: git-commit
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

## Step 1 — Gather required context

Before doing anything, ensure you have:

- **Ticket number** — look in conversation context (e.g. from OpenSpec explore, recent messages). If not found, ask: _"What is the ticket number?"_
- **Draft PR?** — if the user said "draft" or "draft PR", note it for Step 5.

---

## Step 2 — Understand the changes

```bash
git status
git diff HEAD
```

If there are no changes at all — report and stop.

---

## Step 3 — Determine `area`

Read the menu configuration to understand the app's two-level navigation structure:

```bash
cat apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx
```

Map changed files to menu areas using this logic:

- Changes touch **one leaf section** → use `Parent/Child` (e.g. `Deployments/Images`)
- Changes span **multiple sections under one parent** → use just `Parent` (e.g. `Deployments`)
- Changes span **multiple top-level sections** → pick the section with the **most changes**. Use ticket title/description as additional context to break ties.
- Infrastructure/config with no clear menu mapping → use a technical area: `infra`, `config`, `api`

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

If the user requested a PR or draft PR, first generate the PR body from the diff and ticket context:

```markdown
## Summary
<What was done and why — 2-4 sentences>

## Key Changes
- [path/to/file.tsx](<github-file-link>) — short description
- [path/to/file.tsx](<github-file-link>) — short description

## New Components
<List of newly created React components or reusable modules with a one-line description each.>
<Omit this section entirely if no new components were added.>

## Breaking Changes
<Describe any breaking changes to APIs, props, or component interfaces.>
<Omit this section entirely if there are no breaking changes.>


Closes #<ticket>
```

Rules for generating the body:
- **Summary**: explain the *why*, not just the *what*; use ticket description for context
- **Key Changes**: most impactful files only (max ~10); skip trivial files like formatting-only changes
- **New Components**: newly created React components or shared modules only
- **Breaking Changes**: only if interfaces, props, or contracts changed non-backward-compatibly; otherwise omit

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
PR:      <link>  /  skipped
```
