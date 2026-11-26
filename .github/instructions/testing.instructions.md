---
# One canonical file, three consumers — each reads its own scoping key and ignores the others:
#   Claude Code (.claude/rules)          -> `paths`
#   Cursor      (.cursor/rules/testing.mdc stubs to here)        -> `globs` / `alwaysApply` / `description`
#   Copilot     (.github/instructions/testing.instructions.md is a copy)    -> `applyTo`
# Keep all three globs in sync. Edit only here — pre-commit regenerates both mirrors.
# Note: VS Code Copilot scans only `chat.instructionsFilesLocations` (default `.github/instructions`) and
# picks up nothing else there — a file must be named `*.instructions.md` to count — so this rule loads
# once, through the mirror, not twice. Copilot instructions affect chat/agent only — never inline
# tab-completions.
description: Test-authoring rules — queries, mocks, async stability, per-type approach, cost discipline. Use when editing test files.
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
stub; Copilot via `applyTo` through the `.github/instructions/testing.instructions.md` copy) — so it
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

A mock is either **shared** (declared once, in `test-setup.tsx`, for every spec) or **local** (declared in
one spec for that spec). Pick by who needs it, not by convenience.

### Shared mocks and controllers

- A module becomes shared when three or more specs mock it the same way, or when leaving it real breaks every
  render (contexts, Next.js hooks, i18n). Add it to `test-setup.tsx`; don't copy the same `vi.mock` into a
  third spec.
- A shared mock that specs need to steer gets a **controller** in `apps/ai-dial-admin/test-mocks/<name>.ts(x)`.
  The controllers today are `appContextMock` (`AppContext`), `navigationMock` (`next/navigation`),
  `notificationMock` (`NotificationContext`) and `saveValidationMock` (`SaveValidationContext`); read them before
  writing a new one. A controller:
  - keeps **one stable default** — the same router, the same context value — so an effect that lists it as a
    dependency does not loop;
  - exposes the spies and typed setters a spec needs (`navigationMock.router.push`, `setPathname(...)`,
    `saveValidationMock.set({ ... })`), and a `reset()` that `test-setup.tsx` calls in `beforeEach`;
  - takes exported constants and enums from the real module (`importOriginal`), never from a copy;
  - keeps hooks as `vi.fn(impl)`, so `vi.mocked(hook).mockReturnValue(...)` still works for a one-off case and
    `reset()` restores the default.
- Register a new controller in three places in the same change: `vi.mock` plus `reset()` in `test-setup.tsx`,
  its module path in `CONTROLLED_MODULES` in `eslint.specs.config.mjs`, and this list.
- A spec never mocks a controlled module again. It configures the controller in `beforeEach` or in the test;
  a test that needs the real implementation says so through the controller
  (`saveValidationMock.useRealContext()`) or with `vi.unmock(path)`.

### Local mocks

- Use a local mock for what only this spec cares about: a heavy child component (§4 rule 5), a server action
  or API module the component under test calls, a hook whose result the test varies.
- Mock the narrowest module that does the job — the child component, not the whole `ui-kit`. To keep most of a
  real module and replace one export, use `importOriginal` rather than re-declaring the whole surface:
  ```ts
  vi.mock('@/utils/entities', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/utils/entities')>()),
    getEntityLabel: vi.fn(() => 'label'),
  }));
  ```
- Prefer an automock (`vi.mock(path)`) for an action or API module, and set the result per test with
  `vi.mocked(fn).mockResolvedValue(...)`; use `vi.mocked(fn)` for typed access instead of casting.
- Set behavior in `beforeEach` or in the test, not at module scope: the global `afterEach` clears call history
  but keeps implementations, so a default set once at the top survives every test and hides which one relies
  on it.
- A spy the factory needs is declared with `vi.hoisted`; never mutate a module-level object to steer a mock
  (`currentPath.value = …`) — that is what a controller is for.

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
- The async rules in §9 are followed.
- Coverage gate not regressed.
- Lint passes.

Report actual command output rather than asserting success.

## §9 Async & stability

CI runs the suite on 4 CPUs with coverage, so tests run slower there than on your machine. Write them so
they are correct at any speed.

1. **Wait on what the user sees, not on a mock call.** A mock having been called does not mean React has
   re-rendered. Await the element the next line needs, then assert the mock:

   ```tsx
   // Wrong: the call happened, the UI may not have caught up
   await waitFor(() => expect(save).toHaveBeenCalled());
   expect(screen.getByText(SavedI18nKey.Title)).toBeTruthy();

   // Correct
   expect(await screen.findByText(SavedI18nKey.Title)).toBeTruthy();
   expect(save).toHaveBeenCalledOnce();
   ```

   A mock-only wait is fine as a test's **last** statement, written `await vi.waitFor(() => expect(mock)…)`.

   Await the data-dependent element itself, not a heading, container or region that renders while the data
   is still loading — that proves the component mounted, not that the data arrived. A `getBy*` after a
   `findBy*` for a *different* element is the same race whenever the second can appear later than the first:

   ```tsx
   // Wrong: the heading renders during loading, the card only once the page resolves
   expect(await screen.findByRole('heading', { name: ListI18nKey.Title })).toBeTruthy();
   expect(screen.getByText('an-app')).toBeTruthy();

   // Correct: wait on the data, then assert the static chrome
   expect(await screen.findByText('an-app')).toBeTruthy();
   expect(screen.getByRole('heading', { name: ListI18nKey.Title })).toBeTruthy();
   ```

   It passes locally and fails on CI, because a fast machine usually resolves the mock before the second
   line runs. Not linted — the linter cannot know which element appears later.
2. **Keep `waitFor` simple.** One condition, no clicks or state changes inside it (it is retried), no
   `{ timeout }`. Use RTL's `waitFor` for `renderHook` state and for a condition on an element you
   already hold (`toBeEnabled()`); use `findBy*` for an element appearing.
3. **No real sleeps.** Use fake timers (`vi.useFakeTimers()`, `await vi.advanceTimersByTimeAsync(ms)`,
   `vi.useRealTimers()` in `afterEach`) or `await act(async () => {})` to flush. RTL's `findBy*` does not
   advance Vitest's fake timers.
4. **Anchor absence checks.** Polling for something to be absent passes at once. Await something that only
   appears once the result is in (another element, a loader that has gone), then assert the absence.
5. **Stub heavy children, but keep one real test per grid.** Stub `GridView` unless the spec is about the
   grid, and copy an existing stub, for example `Analytics/Pipelines/tests/PipelinesPermissions.spec.tsx`.
   Every grid keeps at least one spec that renders it for real, so a change in the real grid still fails a
   test.
6. **Keep shared mocks stable and re-armed.** The notification mock in `test-setup.tsx` returns one stable
   `showNotification`; a shared mock that builds a new `vi.fn()` per render makes every effect that lists it
   as a dependency refetch in a loop. `vi.clearAllMocks()` keeps implementations, so re-arm any mock whose
   default matters in `beforeEach`.
7. **A test gives the same result on every machine.**
   If the code reads something from the machine — an env variable, today's date, the network — the
   test sets it itself. Never rely on a value being there, or on it being missing.

   Example: a test expects no Keycloak login. CI has no `AUTH_KEYCLOAK_*` variables, so it passes.
   A developer has them in a local env file, so it fails. Fix: the test removes them itself.

   - env variable: `vi.stubEnv(name, value)`; to make it missing, `vi.stubEnv(name, undefined)` (not `''`)
   - date: `vi.useFakeTimers()` + `vi.setSystemTime(...)`
   - network: a mocked `fetch`, never a real request

`npm run lint:specs` (it also runs on staged specs at commit time) rejects the shapes in rules 1–3: a `waitFor` on a
mock call, an action or a `{ timeout }` inside a wait, and `setTimeout`. Rules 4–7 are judgement calls and are not
linted.

## §10 Shared test environment

The suite runs with `isolate: false`: one worker keeps its jsdom environment and its loaded libraries across the
files it runs, which is what makes the run fast. Two setup files keep files from seeing each other:

- `test-reset.ts` runs first and, before each file, drops every application module from the worker's module table
  (so each file gets fresh modules and its own mocks), empties `document.body` and clears both storages.
- `test-setup.tsx` re-registers the shared mocks, resets the controllers in `beforeEach`, and in `afterEach` clears
  mock calls, unstubs globals and env variables, and restores real timers.

What that cleanup cannot undo is yours to avoid:

1. **Change a global only through Vitest.** `vi.stubGlobal('fetch', vi.fn())` in `beforeEach`, or `vi.spyOn` on
   the object; never `global.x = …`, `window.x = …` or `Object.assign(navigator, …)`. A property Vitest cannot
   stub (a getter such as `navigator.clipboard`) is installed with `Object.defineProperty(…, { configurable: true })`.
2. **Change the environment only through `vi.stubEnv`**, never by writing or deleting `process.env`.
3. **Configure a controlled module through its controller.** Navigation: `navigationMock.router.push` is the spy,
   `navigationMock.setPathname(...)` / `setSearchParams(...)` set the location. Save validation:
   `saveValidationMock.dispatch` is the spy, `saveValidationMock.set({ isValid: false })` sets the state, and
   `saveValidationMock.useRealContext()` switches the test to the real provider and hooks. App context:
   `appContextMock.set({ isFullAdmin: false })` for a fixed value, `appContextMock.use(() => ({ ... }))` for one
   read on every render, `appContextMock.sidebar.showSidebar` and `setEntityReadOnly` as spies; read-only mode is
   `appContextMock.set({ isReadOnlyAdmin: true })`, because `useIsReadOnlyAdmin` only reads the context.
   Notifications: `notificationMock.showNotification` and `removeNotification` are the spies. Set any of them in
   `beforeEach` or in the test: all reset before every test.
4. **Leave nothing running.** A timer, interval or subscription a test starts must stop by the end of that test.

The file order is shuffled on every run, so an order dependency fails instead of hiding. A failure that only
appears in some orders is a leak: reproduce it with the seed the run prints
(`npx vitest run --sequence.seed=<seed>`), then fix the spec — don't re-run until it passes.

`npm run lint:specs` rejects rules 1–3: a write to a global, a write or delete on `process.env`, a second
`vi.mock` of a controlled module, and a mock of `use-is-read-only-admin`.
