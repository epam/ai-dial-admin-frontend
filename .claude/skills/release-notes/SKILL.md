---
name: release-notes
description: Use when the user asks to enhance, refine, polish, or "look at" the release notes for a tag — typically a fresh CI-generated pre-release (e.g. `0.16.1-rc.0`) or a stable cut. Reads the auto-generated notes off the GitHub release, classifies and rewrites each bullet in this project's editorial voice, builds the `Deployment Changes` section from `docs/INFRA-CHANGELOG.md` and `docs/upgrade-plans/`, and saves a draft to `claude/release-notes/`. Never edits GitHub directly.
allowed-tools: Read Grep Glob LSP Bash(gh release view:*) Bash(gh release list:*) Bash(gh pr view:*) Bash(gh pr list:*) Bash(gh pr diff:*) Bash(git log:*) Bash(git show:*) Bash(git diff:*) Bash(git tag:*) Bash(git rev-parse:*) Bash(date:*) Write(claude/release-notes/*)
argument-hint: "[tag]"
arguments: tag
model: opus
effort: xhigh
context: fork
agent: general-purpose
---

# AI DIAL Admin Frontend — release-notes enhancer

The CI publishes a release for every tag with bullets that are just the PR titles. Those bullets carry a lot of dirt — conventional-commit prefixes (`feat(scope):`, `fix(area):`), repeated scope prefixes for related PRs on the same feature, misfiled items (`feat(scope):` landing under `Other`), and `## Other` mixing consumer-relevant items (dep security bumps) with pure internal noise (skill scaffolding, changelog generation PRs). The stable releases at `https://github.com/epam/ai-dial-admin-frontend/releases` are what those raw notes look like after a human editorial pass. This skill reproduces that pass.

You are running in a forked, isolated context. Read and research freely — only the final summary you return reaches the main conversation. All file writes happen in this fork; the draft lands at `claude/release-notes/<tag>-draft.md`.

## When to use

- "Enhance the release notes for `0.16.2-rc.0`"
- "Look at the latest pre-release notes and refine them"
- "Help me adjust release notes for the current rc"
- "The CI just published `<tag>`, make it readable"

Do **not** trigger on requests like "what changed in 0.16.0?" — that is a recall question, not a notes-editing task.

## Inputs

`tag` = `$tag` — the GitHub release tag to enhance (e.g. `0.16.1-rc.0`, `0.17.0`). If empty, pick the most recent tag from `gh release list --limit 5` and confirm with the user before editing.

## Workflow

### 1. Resolve target and reference styles

1. `gh release view <tag> --json body,name,tagName` — capture the raw CI notes.
2. `gh release list --limit 10` — locate the previous tag of the same kind (last stable for a stable release, the predecessor `rc` for a delta `rc.N+1`).
3. `gh release view <prev-stable-tag> --json body` (and `<prev-rc-tag>` when relevant) — these are the style anchors. Match their terseness; one line per bullet.
4. `git tag --list | sort -V` + `git log <prev-tag>..<tag> --oneline` — full commit list for the range, to spot hotfix commits the CI dropped.

**Section name normalization:** The CI sometimes emits `## Feat` instead of `## Features` (e.g. patch releases). Always normalize to `## Features` in the draft regardless of what CI wrote.

### 2. Pull source context for each bullet

For every bullet in the raw notes:

1. Parse out the trailing `(Issue #<issue>) (#<PR>)` or just `(#<PR>)`. Canonical reference order is `#<issue> (#<PR>)`.
2. `gh pr view <PR> --json title,body,labels` — read the PR body for the *why* and *what-it-replaces*; the title is too compressed.
3. For bullets without a PR number, find the commit with `git log <prev-tag>..<tag> --oneline | grep -i <keywords>` and `git show <hash>` — fold these into a related entry rather than leaving them standalone.

**Grouping related PRs:** When multiple PRs share the same issue number or are clearly follow-ups on the same feature (e.g. `feat(deployments): MCP registry images source` + `feat(deployments): MCP registry image follow-ups` + `feat(deployments): pre-filter MCP registry servers`), fold them into one bullet with all PR refs at the end: `(#2927, #2986, #3034)`. Don't list every sub-PR as a separate line — large releases (40+ features) require aggressive grouping to stay readable.

### 3. Cross-check `docs/INFRA-CHANGELOG.md` and upgrade plan for deployment changes

The `Deployment Changes` section is built from primary sources:

- `git diff <prev-tag>..<tag> -- docs/INFRA-CHANGELOG.md` — env-var additions/removals/renames that landed in the range.
- Read `docs/INFRA-CHANGELOG.md` at the tag's version section for the canonical variable names and their descriptions.
- Check whether `docs/upgrade-plans/<base-version>.md` exists (e.g. for tag `0.17.0-rc.0` look for `docs/upgrade-plans/0.17.0.md`). If it does, link to it. If not, check `docs/INFRA-CHANGELOG.md` for what changed.
- For env-var canonical names, verify against the actual source code — PR bodies sometimes use pre-rename names, code wins.

### 4. Classify each bullet

The raw CI's `## Features` / `## Fixes` / `## Other` partition is unreliable because it keys off the conventional-commit prefix. Reclassify by actual user impact:

| Where CI put it | Where it belongs | Rule |
|---|---|---|
| `Other` starting with `feat(...)` | `Features` | A feat that lost its slot to a scope prefix. |
| `Other` starting with `fix(...)` | `Fixes` | Same, for fix. |
| `Features` / `Fixes` for a pre-release-only regression | `Fixes` with note "(affects pre-release users of \<feature\> only)" | |
| `Other` for a security CVE dep bump | `Fixes` | Security items are user-relevant. |
| Multiple PRs / hotfix commits on one feature | one folded entry | Cite PR numbers in parens. |

**Drop these entirely** — no consumer-visible effect:

- Skill scaffolding and Claude Code tooling (`chore: create ticket skill`, `chore: init claude documentation`, `chore: add release-notes skill`).
- CI-generated changelog PRs (`chore: add changelog for 0.16.0`).
- Pure internal refactors, renames, and test-only changes.
- `Merge remote-tracking branch …` commits.
- CI-only changes (`chore(ci): add release candidate branching`) — **unless** a maintainer specifically needs to know, in which case keep under `Other` with a one-line rationale.
- Upgrade-plan generation PRs (`chore: clear upgrade plan`).

**Keep in `Other`** — items maintainers or operators care about:

- Security-adjacent dependency bumps (`chore(deps): bump dompurify`, `chore(deps): bump follow-redirects`).
- Infrastructure-relevant dependency upgrades.

If unsure whether to keep a bullet: *would a customer or operator reading these notes care?* If no, drop it.

### 5. Rewrite each kept bullet

Raw form: `* feat(scope): description (Issue #NNN) (#NNN)`. Rewrite to:

```
* <Active-voice description of what changed> — <brief why-it-matters> #<issue> (#<PR>)
```

Rules in order of importance:

1. **One line per bullet.** No multi-paragraph descriptions.
2. **Drop the conventional prefix** (`feat:`, `fix:`, `chore:`, `feat(scope):`). Replace with prose.
3. **Drop scope-as-noun repetition.** Don't start the bullet with the scope name — `feat(deployments): stop button` → `Stop button for deployments` not `Deployments — stop button`.
4. **Use a `—` em-dash for the "why" clause**, not a hyphen or colon.
5. **Backticks for code identifiers**: env vars (`NIM_ENABLED`), config keys, component names, API paths.
6. **Preserve issue + PR refs at the end** in `#<issue> (#<PR>)` order. For grouped entries list all PRs: `(#2927, #2986, #3034)`.
7. **Prefix with `[Preview]`** for preview-gated features (eval framework, MCP registry, etc. when still gated by an env var).
8. **Flag regressions explicitly**: `(regression fix)` for items restoring previously-working behavior.
9. **Quote CVE IDs verbatim** for security upgrades.
10. **For features that graduate to GA**, lead with `Graduate <feature> to GA — <gate that's removed>`.

#### Example transformations (this project's patterns)

```
# Grouping multiple related deployment PRs into one bullet:
- * feat(deployments): support images from MCP registry (Issue #2227) (#2927)
- * feat(deployments): MCP registry images source (Issue #2227) (#2986)
- * feat(deployments): MCP registry image follow-ups (Issue #2599) (#3034)
- * feat(deployments): pre-filter MCP registry servers (Issue #2227) (#2892)
- * feat(deployments): remove version from MCP registry source input (Issue #2227) (#2980)
- * feat(deployments): MCP registry grid details (Issue #2227) (#2987)
+ * [Preview] MCP Registry as deployment image source — browse and pin images from an MCP Registry server directly in the Deployments UI #2227 (#2892, #2927, #2980, #2986, #2987, #3034)

# Dropping prefix and em-dashing the why:
- * feat(list-view): add created_at and updated_at columns (Issue #3099) (#3104)
+ * `Created at` and `Updated at` columns in entity list views — sortable timestamps for all grid rows #3099 (#3104)

# Folding follow-up PRs on the same issue:
- * feat(applications): source field follow-up (Issue #2803) (#3058)
- * feat(applications): reuse SourceField (Issue #2803) (#3032)
- * feat(application): support container source (Issue #2803) (#3051)
+ * Container source support for Applications — configure a source container in the application form #2803 (#3032, #3051, #3058)

# Marking a regression fix:
- * fix(prompts): version switching broken (Issue #2858) (#2865)
+ * Restore prompt version switching (regression fix) #2858 (#2865)

# Dropping noise from Other:
- * chore: create ticket skill (#3033)                 ← drop entirely
- * chore: add changelog for 0.16.0 (#3075)            ← drop entirely
- * chore(ci): add release candidate branching (#2972)  ← drop entirely

# Keeping security dep bump in Other:
- * chore(deps): bump dompurify (#2973)
+ * Upgrade `dompurify` dependency (#2973)

# Preview tag based on env-var gating:
- * feat(eval): `Preview` release evaluation framework
+ * [Preview] Evaluation framework — run and review eval runs via `DIAL_EVAL_API_URL`; gated by env var
```

### 6. Build the `Deployment Changes` section

Add this section **only** when the range introduces env-var, behavioral, or schema changes that operators need to act on.

**This project's format:** If `docs/upgrade-plans/<base-version>.md` exists at the tag, the `Deployment Changes` section is a one- or two-sentence summary followed by a link to the upgrade plan file — not an inline table. This is the established pattern:

```markdown
## Deployment Changes

This release includes high-priority changes. Please review the [full upgrade guide](https://github.com/epam/ai-dial-admin-frontend/blob/<tag>/docs/upgrade-plans/<base-version>.md) before proceeding.
```

Use the alert callout if the changes are critical:

```markdown
## Deployment Changes

> [!IMPORTANT]
> This release requires operator action before upgrading. Please review the [full upgrade guide](https://github.com/epam/ai-dial-admin-frontend/blob/<tag>/docs/upgrade-plans/<base-version>.md).
```

**How to populate it:**

1. `git diff <prev-tag>..<tag> -- docs/INFRA-CHANGELOG.md` — what landed in the range.
2. Read the relevant version block in `docs/INFRA-CHANGELOG.md` for variable names, defaults, and descriptions.
3. If no `docs/upgrade-plans/<base-version>.md` exists yet, note in the editorial file that the upgrade plan is missing and describe what needs to go in `Deployment Changes` inline — the user will decide.
4. Characterize severity: if all new env vars are optional and default-off, use plain text ("This release adds optional configuration flags"). If any is required or changes existing behavior, use `> [!IMPORTANT]`.

**What does not belong here:** Per-app feature configuration (things users configure in the UI, not operators in helm/env). `Deployment Changes` is strictly for env vars, behavioral shifts at the service level, and external system migrations.

### 7. Pre-release / delta handling

If the target is `<X.Y.Z>-rc.N` with `N ≥ 1`:

- Cover only what changed since the previous rc — do **not** consolidate predecessor notes.
- Drop sections with no entries in the delta.
- Do **not** prepend a "Delta since <prev-rc>" pointer — the `-rc.N` suffix already signals it.

### 8. Save the draft (and optional editorial companion)

Write:

- **`claude/release-notes/<tag>-draft.md`** — the final notes, ready to paste into the GitHub release body. No preamble or commentary — just headings and bullets.
- **`claude/release-notes/<tag>-editorial-notes.md`** *(optional, only when useful)* — non-obvious calls worth surfacing:
  - Grouping decisions (which PRs were folded and why).
  - Items dropped, with one-line reason each.
  - Open questions (ambiguous categorization, missing upgrade plan, env-var name disagreement).

### 9. Verify nothing was pushed to GitHub

This skill **never** runs `gh release edit`, `gh release create`, or any write operation against the repo. Drafts only.

## Output format

The file saved to `claude/release-notes/<tag>-draft.md` follows this shape exactly (including `---` separators, which match the CI format):

```markdown
## Features

* <one bullet per change or group>

---

## Fixes

* <one bullet per change>

---

## Other

* <only consumer- or maintainer-relevant items>

---

## Deployment Changes

This release includes high-priority changes. Please review the [full upgrade guide](https://github.com/epam/ai-dial-admin-frontend/blob/<tag>/docs/upgrade-plans/<base-version>.md) before proceeding.
```

Omit any section (including `Deployment Changes`) that has no entries. For a delta `rc`, omit empty sections rather than writing `No changes`. Section order: `Features` → `Fixes` → `Other` → `Deployment Changes`.

## Return to the main conversation

Return a short summary — five lines or fewer:

- The draft path (`claude/release-notes/<tag>-draft.md`).
- Counts of bullets per section after enhancement and grouping.
- Groupings that happened (e.g. "folded 6 MCP registry PRs into 1 bullet").
- Reclassifications (e.g. "moved 2 from Other → Features").
- Items dropped (count, with one example).
- Whether `Deployment Changes` was added, and what it links to (or why it was omitted).
- Any open questions (missing upgrade plan, ambiguous item, env-var name conflict).

Example:

> Drafted `claude/release-notes/0.16.0-draft.md`. 18 Features (grouped from 43 raw), 22 Fixes (grouped from 55 raw), 4 Other. Folded 6 MCP registry PRs into 1 bullet, 4 container-source PRs into 1. Reclassified 0 items. Dropped 4 internal items (skill scaffolding, CI changelog PR, RC branching chore). Added Deployment Changes linking to `docs/upgrade-plans/0.16.0.md` with `> [!IMPORTANT]` callout (NIM_ENABLED / HF_ENABLED are new required opt-in flags). Open: `fix(deployments): multiple validation issues` has no issue number — left as-is with a note in editorial file.

## Safety rails

- **Never edit GitHub.** No `gh release edit`, no `gh release create`. Drafts only.
- **Never invent items.** Every kept bullet maps to a PR or a commit hash in the range.
- **Never silently drop a PR reference.** The bullet ends with the canonical `#<issue> (#<PR>)` refs.
- **Verify canonical names from source**, not from PR bodies.
- **Don't consolidate pre-release notes** into the stable's notes unless explicitly asked.
- **Match the terseness of the predecessor's notes.**

## Maintenance

If you notice a pattern in the raw CI notes that this skill doesn't handle (a new CI section, a recurring rewrite the user keeps requesting, a new conventional-commit scope that misroutes items), surface it in your return summary and offer to update this `SKILL.md`. The user can confirm before any edit lands.
