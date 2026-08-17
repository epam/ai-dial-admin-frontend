---
# One canonical file, three consumers — each reads its own scoping key and ignores the others:
#   Claude Code (.claude/rules)          -> `paths`
#   Cursor      (.cursor/rules/testing.mdc is copied from here)        -> `globs` / `alwaysApply` / `description`
#   Copilot     (.github/instructions/testing.instructions.md, likewise)    -> `applyTo`
# Keep all three globs in sync. Edit only here — pre-commit regenerates the copies.
# Note: VS Code Copilot also default-scans .claude/rules (reading `paths`), so with the mirror in place it
# may load this rule twice when editing a test file. To dedupe, a dev can set, in their own VS Code
# settings, chat.instructionsFilesLocations { ".claude/rules": false } (.vscode is gitignored here, so it
# can't be committed). Copilot instructions affect chat/agent only — never inline tab-completions.
description: Test-authoring rules — queries, mocks, per-type approach, cost discipline. Use when editing test files.
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
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
copy; Copilot via `applyTo` through the `.github/instructions/testing.instructions.md` copy) — so it
stays out of context for non-test work.

## §1 Scope

Applies only when creating or editing:

- `*.test.ts` / `*.test.tsx`
- `*.spec.ts` / `*.spec.tsx`
- `apps/ai-dial-admin/test-setup.tsx`

This rule auto-attaches when you open a matching file — you don't need to read it again or re-open it
mid-task. For non-test work it stays out of context; follow `AGENTS.md` / `openspec/config.yaml` there.

## §2 Cost & usage discipline

Keep context small and runs cheap:

- Read the spec under change **plus the single source file it tests**. Sibling specs and the rest of
  `tests/` are rarely worth the context.
- Scope grep/glob to `src/**` and test directories. `node_modules/`, `.next/`, lockfiles, and
  `coverage/` are large and answer nothing a test needs.
- Don't re-read a file you just edited — the edit tools confirm success.
- Run the **narrowest test that proves the change** (§3). The full `npm run test` always runs with
  coverage, so it belongs at the end as a gate (§7), not in the iteration loop.
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

Use `vitest run` (one-shot). **Watch mode is a hard no** — it never exits, so it hangs the session
rather than failing visibly.

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
   isn't queryable by role, fix the component for accessibility instead. Inventing a fake role to
   query by (`role="icon"`, `role="dashboards"`) is the same violation wearing a disguise — a role
   must be a real ARIA role. Standardize on `userEvent.setup()` + `await user.click()` over
   `fireEvent` (`UsageLog.spec.tsx` is the model; `Header.spec.tsx` still uses `fireEvent` —
   migrate that style when you touch it).

   `fireEvent` is still correct where `userEvent` has no equivalent API: `paste`, `keyDown` with a
   specific modifier (`{ key: 'Enter', shiftKey: false }`), and `change` on a native input. Reach
   for it deliberately in those cases, not as a shortcut around an `await`.

   `container.querySelector` is acceptable **only** for CSS-level assertions — a class name, a CSS
   custom property, an inline `style` — where no semantic query can express the check. Never use it
   to find an element you could have queried by role.
5. **Mock heavy children** — mock AG Grid / Monaco / ECharts and other heavy descendants; assert on
   *your* component's behavior, not the library's. Faster, cheaper, less brittle.

**Non-goals (do NOT test):** exact styling / DOM structure, every line or branch, library internals,
snapshot-everything.

- Exemplars: `src/components/Header/Header.spec.tsx`,
  `src/components/SettingsModal/SettingsModal.spec.tsx`, `src/components/UsageLog/UsageLog.spec.tsx`.

## §5 Mock & setup reuse

Shared mocks live in `apps/ai-dial-admin/test-setup.tsx` — fetch, i18n, next-auth, the Next.js
navigation/headers modules, every context provider, the observers, portals. **Read that file** for the
current inventory instead of trusting a list here, and add a missing mock there rather than inline in
a spec.

Three behaviors of that setup are easy to miss and change how you assert:

- **`t()` returns the key as-is**, so component tests assert i18n keys, not translated text.
- `createPortal` renders inline, so modal content is queryable without extra setup.
- `console.error` and `console.warn` are silenced globally — a test cannot assert on them, and a real
  React warning will not surface in the output.

Mocking mechanics:

- To keep most of a real module and replace one export, use `importOriginal` rather than
  re-declaring the whole surface:
  ```ts
  vi.mock('@/utils/entities', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/utils/entities')>()),
    getEntityLabel: vi.fn(() => 'label'),
  }));
  ```
- Use `vi.mocked(fn)` for typed access to a mocked import instead of casting.
- Call `vi.clearAllMocks()` in `beforeEach` whenever shared mock state could leak between tests —
  the centralized mocks in `test-setup.tsx` persist across a file.

## §6 Conventions

Consolidated from `openspec/config.yaml` (kept here so test work is self-contained):

- No `data-testid` attributes.
- Reuse existing mocks from `test-setup.tsx` instead of creating new ones.
- Co-locate specs in a `tests/` subfolder next to the code: `feature/tests/<name>.spec.ts(x)`.
- Use the `@/` alias for cross-dir imports, never `../../`.
- `import { describe, test, expect } from 'vitest';` — prefer `test(...)` over `it(...)`.

Naming and structure:

- One top-level `describe` per exported symbol, named after it: `describe('Header', ...)`. Add
  further `describe` blocks for distinct states or prop groups: `describe('Header — read-only', ...)`.
- `test` descriptions are complete third-person sentences stating the expected outcome, not the
  mechanics: `test('renders the read-only badge when access is restricted')`, not `test('badge')`.
- Extract a repeated render into an arrow-function helper at the top of the `describe`, so each test
  only states its own deviation:
  ```ts
  const renderHeader = (props?: Partial<Props>) => render(<Header onMenuToggle={vi.fn()} {...props} />);
  ```

Assertions:

- `toHaveBeenCalledOnce()` rather than `toHaveBeenCalledTimes(1)`.
- `toHaveBeenCalledWith(...)` to check arguments — don't inspect `.mock.calls` by index.
- `expect(el).toBeTruthy()` / `.toBeNull()` for presence; skip the double-negative
  `.not.toBeNull()`.

Test *workflow/planning* rules (when to create a test task, no manual-test tasks, final quality gate) live
in `openspec/config.yaml` — they fire at planning time, not while you edit a test file, so they're not here.

## §7 Coverage philosophy

Behavior over lines. The thresholds live in `apps/ai-dial-admin/vitest.config.ts` — read them there
rather than trusting a number quoted in prose. Don't regress the gate; ratchet it up as coverage
grows. Check overall coverage with `npx vitest run --coverage`, a final gate rather than a
per-iteration command. By type: utils → chase branches; components → cover behaviors/states; API →
url/params/response + error path.

## §8 Done criteria

- The targeted file/test passes via `vitest run`.
- No duplicated mocks (reused from `test-setup.tsx`).
- No `data-testid`.
- Coverage gate not regressed.
- Lint passes.

Report actual command output rather than asserting success.
