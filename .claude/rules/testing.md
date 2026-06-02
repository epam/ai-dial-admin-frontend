---
# One canonical file, three consumers — each reads its own scoping key and ignores the others:
#   Claude Code (.claude/rules)          -> `paths`
#   Cursor      (.cursor/rules/testing.mdc symlinks here)              -> `globs` / `alwaysApply` / `description`
#   Copilot     (.github/instructions/testing.instructions.md symlinks here) -> `applyTo`
# Keep all three globs in sync. Editing the body updates every tool at once (the others are symlinks).
description: Test-authoring rules — queries, mocks, per-type approach, cost discipline. Use when editing test files.
paths:
  - "**/*.{test,spec}.{ts,tsx}"
  - "**/test-setup.tsx"
globs: "**/*.spec.ts, **/*.spec.tsx, **/*.test.ts, **/*.test.tsx, **/test-setup.tsx"
applyTo: "**/*.spec.ts, **/*.spec.tsx, **/*.test.ts, **/*.test.tsx, **/test-setup.tsx"
alwaysApply: false
---

# Testing rules

Canonical guidance for writing and updating tests in this repo. Claude Code, Cursor, and GitHub Copilot
MUST follow this **only when working on test files**. It covers two things: keeping token/cost spend low
while iterating, and a meaningful per-type testing standard so coverage is purposeful, not line-chasing.

All three tools auto-load this rule only when reading/editing files that match the patterns in the
frontmatter above (Claude Code via `paths`; Cursor via `globs` through the `.cursor/rules/testing.mdc`
symlink; Copilot via `applyTo` through the `.github/instructions/testing.instructions.md` symlink) — so it
stays out of context for non-test work.

## §1 Scope

Applies only when creating or editing:

- `*.test.ts` / `*.test.tsx`
- `*.spec.ts` / `*.spec.tsx`
- `apps/ai-dial-admin/test-setup.tsx`

Read this once per task; don't re-read it. For non-test work, ignore this file and follow
`CLAUDE.md` / `openspec/config.yaml`.

## §2 Cost & usage discipline

Keep context small and runs cheap:

- Read only the spec under change **plus the single source file it tests**. Don't open sibling specs
  or the whole `tests/` directory "for reference."
- Never read `node_modules/`, `.next/`, lockfiles, or `coverage/`. Scope grep/glob to `src/**` and
  test directories.
- Don't re-read a file you just edited — the edit tools confirm success.
- Run the **narrowest test that proves the change** (§3). Never run the full `npm run test` or
  `--coverage` while iterating; the full run is a final gate only (§7).
- Cap retries at ~3 on the same failure, then report the blocker instead of looping.
- Reuse existing mocks/helpers (§5) before searching the tree. Assert with `expect`; don't dump large
  objects or `console.log` into context to "see" state.

## §3 Test commands

Run from `apps/ai-dial-admin/` so the `@/` alias resolves. Cheapest first:

```bash
# single case — cheapest, prefer this while iterating
npx vitest run src/path/to/file.spec.ts -t "pattern"

# single file
npx vitest run src/path/to/file.spec.ts

# full coverage — final gate only (see §7)
npx vitest run --coverage
```

Always use `vitest run` (one-shot). Never use watch mode — it hangs the session and burns tokens.

## §4 Testing approach by type

The core standard. Pick the section matching what you're testing.

### API / server-action tests — *test the contract: call, URL, params, response*

- Mock fetch via `vitest-fetch-mock`: `createFetchMock(vi)` + `enableMocks()`; reset in `beforeEach`
  (`fetch.resetMocks()`, or `vi.clearAllMocks()` for server actions).
- Assert the **called URL**:
  `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/path'), expect.anything())`.
- Assert **request params/body** where they matter, and the **parsed response** value/shape returned
  to the caller (`toEqual` for objects).
- Cover the **error/failure path** (non-ok response / thrown error), not just the happy path.
- Server actions: mock the API client + `getUserToken`; assert the action calls the client
  **with the token** (`toHaveBeenCalledWith(..., TOKEN_MOCK)`).
- Exemplars: `src/server/tests/utility-api.spec.ts`, `src/app/actions.spec.ts`.

### Util tests — *prove stable, expected results across inputs*

- Positive cases: typical inputs → exact expected output (`toEqual` for objects/arrays).
- Negative / edge cases: invalid data, empty collections, boundary values.
- Missing params: `undefined` / `null` / no-arg → the defined fallback behavior.
- Deterministic: use `vi.useFakeTimers()` for any date/time-dependent logic.
- Chase **high branch coverage** here — utils are cheap and deterministic to cover fully.
- Exemplars: `src/utils/tests/schema.spec.ts`, `src/utils/tests/keys.spec.ts`.

### Component tests — *behavior, not lines*

Base (render key elements + callbacks fire) plus all four extensions:

1. **Render key elements** — assert the critical UI is present for the given props (labels, primary
   actions, key fields). Use i18n **keys**, not translated text: the mocked `t()` returns the key
   as-is, so assert on the key string.
2. **Callbacks on interactive elements** — spy with `vi.fn()`; assert `toHaveBeenCalled()` and, where
   it matters, `toHaveBeenCalledWith(expectedParams)`.
3. **State / conditional variants** — test each meaningful render state, not just the happy path:
   read-only vs editable, empty vs populated, loading/error, disabled vs enabled (e.g. `Header`'s
   read-only badge present/absent).
4. **Query priority + interactions** — query by **role** first
   (`getByRole('button', { name })`), then label/text. **Never use `data-testid`**; if an element
   isn't queryable by role, fix the component for accessibility instead. Standardize on
   `userEvent.setup()` + `await user.click()` over `fireEvent` (`UsageLog.spec.tsx` is the model;
   `Header.spec.tsx` still uses `fireEvent` — migrate that style when you touch it).
5. **Mock heavy children** — mock AG Grid / Monaco / ECharts and other heavy descendants; assert on
   *your* component's behavior, not the library's. Faster, cheaper, less brittle.

**Non-goals (do NOT test):** exact styling / DOM structure, every line or branch, library internals,
snapshot-everything.

- Exemplars: `src/components/Header/Header.spec.tsx`,
  `src/components/SettingsModal/SettingsModal.spec.tsx`, `src/components/UsageLog/UsageLog.spec.tsx`.

## §5 Mock & setup reuse

Shared mocks live in `apps/ai-dial-admin/test-setup.tsx`. Reuse them; add any missing mock
**centrally there**, not inline in a spec. It already mocks:

- fetch (`vitest-fetch-mock`)
- `useI18n` — **`t()` returns the key as-is** (assert keys, not translated text)
- `useSession` (next-auth)
- `next/navigation`, `next/headers`
- all context providers (Notification, FileFolder/PromptFolder/AppsFolder/ToolsetsFolder, Theme,
  RuleFolder, AppContext, SaveValidation)
- `next/image`
- `ResizeObserver`, `IntersectionObserver`
- `createPortal` (renders modal content inline)
- `scrollIntoView`, Monaco `queryCommandSupported` shim

Note: `console.error` and `console.warn` are mocked (silenced) globally.

## §6 Conventions

Consolidated from `openspec/config.yaml` (kept here so test work is self-contained):

- No `data-testid` attributes.
- Reuse existing mocks from `test-setup.tsx` instead of creating new ones.
- Co-locate specs in a `tests/` subfolder next to the code: `feature/tests/<name>.spec.ts(x)`.
- Use the `@/` alias for cross-dir imports, never `../../`.
- `import { describe, test, expect } from 'vitest';` — prefer `test(...)` over `it(...)`.
- Require unit tests for new/updated code; no manual-test tasks.

## §7 Coverage philosophy

Behavior over lines. The gate in `apps/ai-dial-admin/vitest.config.ts` is **branches 40 /
functions 40 / lines 50 / statements 50** (v8). **Don't regress it**; ratchet thresholds up as
coverage grows. Check overall coverage with `npx vitest run --coverage` — a final gate, not a
per-iteration command. By type: utils → chase branches; components → cover behaviors/states; API →
url/params/response + error path.

## §8 Done criteria

- The targeted file/test passes via `vitest run`.
- No duplicated mocks (reused from `test-setup.tsx`).
- No `data-testid`.
- Coverage gate not regressed.
- Lint passes.

Report actual command output rather than asserting success.
