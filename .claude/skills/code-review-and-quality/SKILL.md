---
name: code-review-and-quality
description: Five-axis code review before merge. Use for quality passes after implementation, before merge, and when asked to review a diff.
context: fork
---

# Code review and quality

## Overview

Review every non-trivial change before it lands on the main line. Use **five axes**: correctness,
readability, architecture, security, performance — plus two repo-specific axes (repo patterns,
accessibility).

**Approval bar:** approve when the change clearly **improves or preserves** overall code health and
matches project conventions. Do not block because you would have written it differently. Do block on
real defects, security issues, or violations of agreed patterns.

## When to use

- Before merge / when asked to review a change
- After implementation (self-review or cross-review)
- After bugfixes (review the fix **and** its regression coverage)
- When evaluating code produced by another agent or author

## Review modes

| Mode                | Use when                            | Required context                                                                              |
| ------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| **Local review**    | Reviewing uncommitted local changes | `git status`, `git diff`, full changed files, related OpenSpec artifacts if any                |
| **PR review**       | Reviewing a GitHub PR number or URL | PR metadata, PR diff, full changed files at PR head, related OpenSpec artifacts                |
| **Self-review**     | Finishing an implementation slice   | Touched files, completed task, tests run, remaining task status                                |
| **OpenSpec review** | Reviewing an OpenSpec-backed change | `proposal.md`, `design.md`, `tasks.md`, changed specs, implementation diff                     |
| **Pipeline review** | CI/bot review of a PR diff          | Base/head refs, PR diff, full changed files, related OpenSpec artifacts, relevant check output |

For PR review, read full changed files, not only diff hunks. Diffs show what changed; full files show
whether the change fits the surrounding design. This codebase is highly patterned — a change can be
individually correct and still wrong because it ignores the established shape.

## Pipeline review mode

When the review runs non-interactively — CI, a scheduled bot, the `code-review` agent — the axes are
the same but the result must be deterministic and machine-readable. Read
`references/pipeline-mode.md` for the output schema, fail rules, and comment-publishing contract.
Skip it entirely for an interactive review.

## OpenSpec review gate

If the change is tied to OpenSpec, review the artifacts **before** judging the code:

1. Identify the change from the branch, PR description, user request, or `openspec list --json`.
2. Read the artifacts under `openspec/changes/<change>/`: `proposal.md` (problem, scope, non-goals),
   `design.md` (architecture and local patterns), `tasks.md` (promised implementation and
   verification), and changed specs under `specs/**/spec.md`.
3. Check the diff against the artifacts:
   - Implementation matches the accepted scope with no silent scope creep.
   - Completed task checkboxes correspond to real code and tests.
   - Requirements discovered during implementation are captured in specs/design/tasks, not only code.
   - Non-goals are still respected.
4. Confirm the delta spec was folded into the consolidated `openspec/specs/<capability>/spec.md`, or
   that archiving will do it. For Analytics, changes belong in the single master
   `openspec/specs/analytics/spec.md` — a new file under that directory is a finding.
5. If implementation reveals a design/spec gap, request an artifact update before or alongside code.

Block merge when code behavior materially diverges from the artifacts, when tasks are marked complete
without implementation, or when user-facing requirements were implemented without updating the spec.

## Review axes

### 1. Correctness

- Matches spec, task, or PR description
- Edge cases: null, empty, boundaries, errors — not only the happy path
- Tests exist, assert **behavior**, and would catch regressions
- Watch for off-by-one, races, inconsistent state
- Server actions: the error path returns `{ success: false, errorHeader, errorMessage }` rather than
  throwing into the component, and the caller actually surfaces it

### 2. Readability and simplicity

- Names are specific; avoid meaningless `data`, `result`, `temp`
- Control flow is easy to follow; no nested ternaries (`.claude/rules/code-standards.md`)
- Abstractions **earn** their complexity; prefer duplication over the wrong abstraction until the
  pattern repeats (rule of three)
- Flag simplification opportunities: repeated logic, deep nesting, broad functions, verbose
  conditionals that would read better as a focused helper, hook, component, or util
- Do not request extraction just because code *could* be abstracted — require a concrete
  readability, testability, or reuse benefit
- Comment density matches the surrounding file, and no comment restates a fact its type already
  carries — judge against the two failure modes in `.claude/rules/code-standards.md` rather than
  against a comments quota

### 3. Architecture

- Fits the single-app layout: everything under `apps/ai-dial-admin/src/`. There is no `libs/`; do not
  suggest extracting to one.
- Code lands at the right level: `components/Common/` is presentational and domain-free,
  `components/<Entity>/` is feature-specific, contexts live in `src/context/`, pure functions in
  `utils/`, API classes in `src/server/`
- Imports use the `@/` alias, never `../../`
- Server actions stay in `src/app/[lang]/<entity>/actions.ts` with `'use server'`, authenticate via
  `getUserToken()`, and delegate to an API class in `src/server/` — business logic does not live in
  the action
- State is React Context + hooks. A new state-management dependency is a blocking finding.
- Named finite sets (statuses, modes, view types) use `enum`, not string-literal unions
- No sneaky circular deps or leaky module APIs
- Types live in `models.ts` / `src/models/`, constants in `constants.ts` — not mixed

### 4. Security

- User and external input validated at boundaries; treat backend data as untrusted
- No secrets in code, logs, or repo. Never read `.env*.local`; new variables are declared in
  `.env.template` as commented entries
- Tokens: server actions pass the user token through `getUserToken()`; a token must never reach a
  client component or a log line
- XSS-aware rendering — anything rendering user or backend HTML goes through `dompurify`
- New dependencies: necessity, maintenance, size, license

### 5. Performance

- N+1 calls, unbounded fetches, missing pagination on list surfaces
- Avoidable re-renders, huge props, sync work on hot paths
- AG Grid: column definitions and callbacks are stable references, not rebuilt each render; heavy
  cell renderers are memoized
- Only flag with **measurable or clear scaling** reasoning

### 6. Repo patterns

The highest-value axis in this codebase, because a violation is invisible in isolation:

- **Entity views** follow `View` (client component owning tabs, local edits, save/discard, receiving
  `originalEntity` + etag from the page server component) → `TabsContent` (switches on
  `EntityViewTab`) → `List` (uses `BaseEntityList` with column defs from `constants/grid-columns/`).
  A new entity view that invents its own shape is a `required` finding.
- **Provider order** in `[lang]/layout.tsx` is load-bearing — read the current stack there. A change
  that reorders it or inserts mid-stack needs a stated reason, because a consumer of an outer context
  breaks silently rather than loudly.
- **Design system first.** Reuse `@epam/ai-dial-ui-kit` and `components/Common/` before new markup.
  Query the `ai-dial-ui-kit` MCP server (`searchEntity`, `getEntityDetails`) rather than grepping
  `node_modules` or hand-rolling a control. Tabular data uses AG Grid — never a CSS grid/flex table.
  Icons come from `@tabler/icons-react`; no inline SVG or unicode glyphs.
- **Styling** uses Tailwind theme tokens and CSS variables. A hardcoded hex or a stock Tailwind
  color (`text-gray-400`) is a finding — see `.claude/rules/components.md` §6.
- **i18n**: no hardcoded user-facing strings. Keys go in `src/locales/en.ts` grouped by
  `<Entity>I18nKey` enums in `src/constants/i18n.ts`; check the shared sections (`BasicI18nKey`,
  `ButtonsI18nKey`, `EntitiesI18nKey`) before adding a duplicate.
- **Responsive**: both Tailwind's default prefixes and the five named screens in
  `apps/ai-dial-admin/tailwind.config.js` (`mobile`, `small_tablet`, `large_tablet`, `desktop`,
  `large_desktop`) are available. The codebase predominantly uses the defaults (`lg:`, `md:`, `sm:`).
  Don't mix both systems inside one component, and don't introduce a prefix that isn't in the config
  — `npm run validate:agent-docs` fails on unknown named prefixes. JS branching goes through
  `useIsMobileScreen` / `useIsTabletScreen`, not raw `window.innerWidth`. Note the JS thresholds in
  `src/utils/mobile.ts` (600 / 1024) do not line up with the CSS screens (767 / 1023); if a change
  depends on them agreeing, say so.

### 7. Accessibility

Apply `.claude/rules/a11y.md` (always loaded). The review-specific points:

- Interactive elements are real `<button>`/`<a>`, not `<div onClick>`. `jsx-a11y` reports these as
  warnings, so lint passing is not evidence.
- Toggle/expand/sort state is exposed via ARIA, not only a class change
- New AG Grid columns have a real `headerName`; icon-only action cells have an accessible name
- Contrast uses theme tokens, never a hardcoded hex
- A spec that cannot query an element by role — or invents a fake role such as `role="icon"` to
  query by — is a finding, not a workaround

## Repo-specific routing

Use these as the source of truth before applying generic advice:

| Change area                          | Read / apply                                                     |
| ------------------------------------ | ---------------------------------------------------------------- |
| Project context, stack, architecture | `openspec/config.yaml`, `AGENTS.md`                              |
| Cross-cutting TypeScript             | `.claude/rules/code-standards.md`                                |
| Components, context, hooks           | `.claude/rules/components.md`                                    |
| Pure functions                       | `.claude/rules/utils.md`                                         |
| Tests                                | `.claude/rules/testing.md`                                       |
| Accessibility                        | `.claude/rules/a11y.md`                                           |
| ui-kit components                    | `ai-dial-ui-kit` MCP server before recommending raw HTML          |
| Commit / PR scope naming             | `.claude/reference/areas.md`                                     |
| Agent config (`.claude`, `.cursor`)  | `npm run validate:agent-docs` must pass; mirrors stay symlinks    |
| Backend contracts                    | `ai-dial-admin-backend`, `ai-dial-admin-deployment-manager-backend` |

Do not import generic standards that conflict with these repo rules — for example, do not request a
different REST envelope, raw HTML controls, a `libs/` extraction, or an external state library.

## Code quality standards

Cross-cutting checks, after the repo-specific rules:

- Prefer specific names over `data`, `result`, `temp`, `item` when the domain is known
- Keep control flow shallow with early returns or extracted helpers
- Avoid magic numbers; name domain thresholds, debounce delays, limits, TTLs
- Avoid mutation of shared state; local mutation only when contained and clearer
- `async`/`await` with `try`/`catch`, not `.then()` chains
- Handlers use the `on` prefix for both props and local implementations — this repo does not use
  `handleX` (see `.claude/rules/components.md` §7)
- No `console.log` in application code (`no-console` allows `warn`/`error`/`info`)
- No TODO/FIXME in merge-ready code unless linked to an accepted, non-blocking follow-up
- Tests assert observable behavior and meaningful edge/error paths, not implementation details

## Change sizing

| Size (approx.) | Expectation                                                               |
| -------------- | ------------------------------------------------------------------------- |
| ~100 lines     | Good — one focused review                                                 |
| ~300 lines     | OK if **one** logical change + tests                                      |
| ~1000+ lines   | Too large — ask to split (stack, vertical slices, or refactor vs feature) |

**Never mix** a large refactor with new behavior in one changeset unless explicitly agreed.

## Comment severity

| Label                         | Meaning                                             |
| ----------------------------- | --------------------------------------------------- |
| _(none)_ or **Required:**     | Must fix before merge                               |
| **Critical:**                 | Blocks merge — security, data loss, broken contract |
| **Warning:**                  | Non-blocking risk or missing non-critical evidence  |
| **Nit:**                      | Optional — style, minor preference                  |
| **Optional:** / **Consider:** | Worth discussing, not blocking                      |
| **FYI:**                      | Context only                                        |

In pipeline JSON use the lowercase values: `critical`, `required`, `warning`, `nit`, `optional`, `fyi`.

## Review process

1. **Context** — what does this change do? Which spec/task? Expected behavior?
2. **OpenSpec gate** — if applicable, compare implementation to proposal/design/tasks/specs
3. **Tests first** — coverage, names, edge cases, behavioral assertions
4. **Implementation** — walk the files against the axes above
5. **Findings** — every item labeled with a severity
6. **Verification story** — what was run, what still needs a human or browser check
7. **Verdict** — approve, comment, request changes, or block

## Validation matrix

**Pipeline review mode: never run `npm run build`.** Rely on dedicated CI build jobs.

Vitest must run from `apps/ai-dial-admin/` or the `@/` alias won't resolve. Pick the smallest set
that proves the change:

| Change type                      | Expected validation                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| Component / hook / context       | `npx vitest run <spec>` for touched specs, `npm run lint`                              |
| Util                             | `npx vitest run <spec>` — utils should reach high branch coverage                      |
| Server action / `src/server/`    | `npx vitest run <spec>` covering called URL, params, parsed response, and error path   |
| Grid column defs / renderers     | Touched specs plus `npm run lint`; note that the grid itself is mocked in tests        |
| i18n keys                        | `npm run lint`; confirm the key exists in `src/locales/en.ts` and reuses shared groups |
| Routing / layout / provider tree | Touched specs, `npm run lint`, and `npm run build` (interactive only)                  |
| Agent config                     | `npm run validate:agent-docs:test` then `npm run validate:agent-docs`, when present     |
| Broad cross-cutting change       | `npm run test` (full, with coverage) and `npm run lint`                                |

Coverage thresholds live in `apps/ai-dial-admin/vitest.config.ts`. Read them there; don't regress the
gate.

Record skipped checks with a reason. **A review without a verification story is incomplete** — and
report actual command output rather than asserting success.

For browser-observable acceptance criteria, the verification story should name the
`spec-browser-verify` run or explicitly say why none was needed. A unit test for the underlying logic
is not a substitute.

## Decision policy

| Verdict             | Use when                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Approve**         | No blocking issues; relevant verification is green or CI covers it                          |
| **Approve/comment** | Only optional or low-risk improvements remain                                               |
| **Request changes** | Required issues, failing relevant checks, missing tests for risky behavior, OpenSpec drift  |
| **Block**           | Security issue, data loss risk, broken public contract, secrets exposure, invalid auth flow |
| **Comment only**    | Draft PR, exploratory review, or user asked for non-blocking feedback                       |

Pipeline mapping: `pass` = Approve; `warn` = Approve/comment or Comment only with non-blocking
findings; `fail` = Request changes or Block.

## Commit / PR description

- **Subject:** imperative and informative alone in history. Format is
  `<type>(<area>): <description> (Issue #<n>)` with the area drawn from `.claude/reference/areas.md`.
- **Body:** what, why, tradeoffs, links to issues.
- Weak subjects to reject: "Fix bug", "WIP", "Phase 1", "Small changes".

## Review checklist

`references/review-checklist.md` holds the literal template to copy when writing up a review.

## Rationalizations to reject

| Excuse                     | Response                                                        |
| -------------------------- | --------------------------------------------------------------- |
| "It works, ship it"        | Readability, security, and architecture debt still compound.    |
| "I wrote it, it's fine"    | A second pass catches blind spots.                              |
| "We'll clean up later"     | Cleanup before merge unless a true emergency + tracked follow-up. |
| "Tests pass, so it's good" | Tests don't replace architecture or security review.            |
| "Lint is clean"            | Most `jsx-a11y` rules here are warnings; clean lint proves little. |

## Red flags

- Merge with no real review or evidence
- Only glancing at tests, ignoring other axes
- Huge PR with "no time to split"
- Bugfix without a regression test
- Comments without severity — the author cannot prioritize
- Rubber-stamp "LGTM"
- A new entity view, grid, or modal that doesn't match the existing shape

## After review

- [ ] All **Critical** / **Required** items closed or explicitly deferred with a reason
- [ ] Tests and lint for the touched scope are green
- [ ] OpenSpec tasks/specs/design reflect the implementation state
- [ ] Verdict and severity-labeled notes are clear for the author
