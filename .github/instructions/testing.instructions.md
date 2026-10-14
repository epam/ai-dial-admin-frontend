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
description: Test-authoring rules — queries, mocks, async/timing stability, per-type approach, cost discipline. Use when editing test files.
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
   *your* component's behavior, not the library's. Faster, cheaper, less brittle. This is a
   requirement, not a suggestion — see §9.4 for the exact `GridView` mock and the one exception.
6. **Wait on what the user sees** — async UI is awaited with `findBy*`, never with a `waitFor` on a
   mock call followed by synchronous queries. See §9.

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
- No banned async shape from §9 (settle-barrier `waitFor`, real sleeps, timeout bumps, an un-stubbed
  grid in a spec that isn't about the grid), and the file passes twice, once shuffled (§9.7).
- Coverage gate not regressed.
- Lint passes.

Report actual command output rather than asserting success.

## §9 Async, timing & stability

CI runs the whole suite in one `--runInBand` process under a 4 GB heap with v8 coverage, so every test
runs slower and with less CPU than on your machine. A test that passes at 2 s locally can miss the 5 s
`testTimeout` there, and a `waitFor` that settles in 300 ms can miss its 1 s window. Write every test
so that it is **correct regardless of speed** and **cheap enough not to matter**. Each rule below
exists because a banned shape is already in this repo and has failed.

### §9.1 Wait on the visible result, never on a mock call

A mock having been called says nothing about React having re-rendered. The shape below passes on a fast
machine and fails on a slow one, because the `getBy*` after it runs before the render:

```tsx
// Wrong — a settle barrier: the call happened, the UI may not have caught up
await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
expect(screen.getByText(SavedI18nKey.Title)).toBeTruthy();

// Correct — wait for the thing the next line depends on
await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
expect(await screen.findByText(SavedI18nKey.Title)).toBeTruthy();
expect(updatePipeline).toHaveBeenCalledOnce();
```

- Whatever the next statement needs, wait for **that**: `await screen.findBy*(...)` for something that
  will appear, then assert the mock afterwards (it has necessarily been called by then).
- Waiting on a mock call is allowed only as the **last** statement of a test, when there is no UI outcome
  to wait on (a fire-and-forget call), and then with Vitest's `await vi.waitFor(() => expect(mock)…)`, not
  RTL's `waitFor`. Nothing may depend on the render after it. (`vi.waitFor` is also what the spec lint
  leaves alone, so the exception is visible in the code.)
- After `await user.click(...)` / `user.type(...)` the event has been dispatched and wrapped in `act`;
  a **synchronous** handler's effects are already visible — assert straight away with no wait. Only
  work that crosses a promise (a server action, `fetch`, a debounced effect) needs a wait.
- Mount-time fetches: don't `waitFor(() => expect(getX).toHaveBeenCalled())` to "let it settle". `await
  screen.findBy*` on the first thing the fetched data renders.

### §9.2 `findBy*` and `waitFor` — which and how

- One element appearing → `await screen.findByRole(...)` / `findByText(...)`. Don't wrap a single
  `getBy*` in `waitFor` (`waitFor(() => expect(screen.getByX()).toBeTruthy())` → `await screen.findByX()`).
- Absence → `await waitForElementToBeRemoved(...)` when it is present first, otherwise assert
  `queryBy*` is `null` **after** awaiting whatever should have removed it. Don't poll for absence on
  its own: it passes at once, before the thing you meant to wait for has happened.
- **Anchor every absence or "not called" assertion on something positive.** Awaiting a mock call and
  flushing is not enough: the check passes just as well if the component never got to its final state,
  or if the behavior it guards is broken. Wait for something that only exists once the result has been
  taken in — another element the same response renders, a loading indicator that was present and has
  gone, the control that comes back enabled, the element that replaces the absent one — then assert
  the absence. When the UI shows nothing at all (a refused read leaves the state unchanged), await the
  mock's own returned promise inside `act` so the component's continuation has run. To check the anchor
  works, break the production behavior for a moment and confirm the test fails. For a count ("reads
  each window exactly once"), settle on a positive signal first, then assert the exact number, so a
  late duplicate fails it.
- Use RTL's `waitFor` only for a **DOM-derived condition** with no single element to find (for example a
  computed attribute across several elements); use `vi.waitFor` for a **non-DOM condition** (a mock's call
  count, a value read off a ref). Keep the callback to **one condition**, side-effect free — a
  `waitFor` callback is retried until it stops throwing, so a click or a state change inside it runs
  repeatedly.
- State read from `renderHook` (`result.current…`) is waited on with **RTL's** `waitFor`, not
  `vi.waitFor`: RTL's wraps the wait in `act`, and a hook update outside `act` is not flushed. The same
  goes for conditions on an element you already hold, such as `toBeEnabled()` on a button, where
  `findBy*` cannot express "has become enabled".
- Never put a user action (`click`, `type`) or a second unrelated `expect` inside `waitFor`. Do the
  action outside, then wait for its result; assert each independent fact on its own line afterwards.
- Never hide a slow test by passing `{ timeout: 5000 }` to one call, or a third argument to `test(...)`.
  A test that needs more time is either mounting too much (§9.4) or waiting on the wrong thing (§9.1);
  fix that. The one exception is a test whose slowness is inherent and commented as such.
- No empty or constant `waitFor` bodies, and no `await new Promise(r => setTimeout(r, 0))` to "flush":
  use `await act(async () => {})` for a microtask flush, or `await screen.findBy*`.

### §9.3 Time: fake it, don't sleep

Real `setTimeout` waits are banned in specs — they cost wall-clock time, and on a slow runner they are
shorter than the work they are waiting for.

- **"Did NOT happen" assertions** (`not.toHaveBeenCalled`, "doesn't refetch", "debounce hasn't fired")
  must not sleep a guess like 30 ms. Use fake timers and advance past the interval deterministically:

  ```tsx
  vi.useFakeTimers();                                       // and vi.useRealTimers() in afterEach
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  // ...
  await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 1);
  expect(onSearch).not.toHaveBeenCalled();
  ```

  Exemplar: `src/components/Deployments/Fields/ContainerSource/tests/McpServerNameField.spec.tsx`.
- A spec that uses fake timers restores real timers in `afterEach` (`vi.useRealTimers()`); a leaked
  fake clock turns the next test's `findBy*` into a hang.
- RTL's `findBy*`/`waitFor` auto-advance only Jest's fake timers, not Vitest's. With `vi.useFakeTimers()`
  on, a wait that depends on a timer hangs until it times out: advance explicitly with
  `await vi.advanceTimersByTimeAsync(ms)` rather than switching back to a real sleep.
- Pass a fixed date (`vi.setSystemTime(...)`) for anything date-dependent; never depend on `Date.now()`.

### §9.4 Render the smallest thing, stub the grid

Time in this suite is mostly spent mounting. Real AG Grid + ui-kit + Monaco is the 2–3 s test that sits
closest to the timeout, and it is what turns a 1 s `waitFor` into a coin flip under load.

- **Stub `GridView` unless the test is about the grid.** If you are asserting on a view, tab, toolbar,
  modal, or on the column definitions / row data you pass in, mock it and assert on what it received:

  ```tsx
  vi.mock('@/src/components/Grid/GridView/GridView', () => ({
    default: ({ rowData }: { rowData?: unknown[] }) => <div role="grid" aria-rowcount={rowData?.length ?? 0} />,
  }));
  ```

  Exemplars: `Analytics/Pipelines/tests/PipelinesPermissions.spec.tsx` (reads `columnDefs`),
  `Analytics/Pipelines/Failures/tests/FailuresGrid.spec.tsx` (captures props). About 40 specs already
  do this; don't re-invent a different shape — copy the closest one.
- The **exception**: a spec whose subject is the grid itself (cell rendering, sorting, selection,
  `BaseEntityList` wiring, the empty-data state a real grid renders). Keep **one** such spec per grid,
  give it `findBy*` waits only, and keep views that merely *contain* that grid on the stubbed path. A
  stub that cannot reproduce what the assertions read (the entity list specs assert the real `Data grid`
  region and the empty state) is the signal the spec belongs on the exception side; don't force it.
  When a stub replaces a grid whose row click or cell click the test relies on, have the stub fire the
  same callback the real grid would (for example `additionalGridOptions.onRowClicked({ data })`), so
  that wiring is still exercised.
- Don't mount a whole `View` to test a field or a hook. Render the field, or use `renderHook`. A test
  that needs six providers and a grid to check one callback is testing at the wrong level.
- Mock Monaco, ECharts, and other heavy descendants the same way (§4.5).

### §9.5 `userEvent` cost

Every keystroke from `user.type` is a dispatch plus a React render, so cost grows with string length
and with how much of the tree re-renders per keystroke.

- For any string longer than a few characters, `await user.click(input)` then `await user.paste(text)`
  (exemplar: `PipelineJsonRoundTrip.spec.tsx`), or `fireEvent.change` on a native input (§4.4). Use
  `user.type` only when the per-keystroke behaviour (validation as you type, debounce, key handlers) is
  what is under test.
- Create **one** `userEvent.setup()` per test (not per interaction, and not at module scope).
- `user.clear` + `user.type` on every field of a long form is a smell: if only one field matters,
  set the others through props or initial state.

### §9.6 Isolation and budget

- A test must pass **alone**, in **any order**, and **twice in a row**. Reset every shared mock in
  `beforeEach` (`vi.clearAllMocks()`; re-arm `mockResolvedValue`s there, not at module scope), and never
  rely on state a previous test left in a module-level variable, `localStorage`, or a mock.
  `vi.clearAllMocks()` clears calls but **keeps implementations**: a `mockResolvedValue` or
  `mockImplementation` set by an earlier test survives it and answers the next test's call. Re-arm every
  mock whose default matters in `beforeEach` (or use `mockReset`); this is what made one audit spec fail
  on 11 of 25 shuffle seeds.
- Don't create fresh functions per render in a shared mock. The global `useNotification` mock in
  `test-setup.tsx` returns one stable `showNotification`, like the real provider; a mock that returns a
  new `vi.fn()` each render re-runs every effect that lists it as a dependency, so a component refetches
  in a loop and the outcome depends on speed.
- **Time budget:** a component test that takes **over ~1 s** on your machine (the `vitest run` output
  prints each test's duration) is a smell and **over ~2 s** needs a reason — you are mounting too much
  (§9.4) or waiting on the wrong thing (§9.1). Measure with `npx vitest run <file> --reporter=verbose`.
- Prefer many small tests over one long scenario with fifteen interactions: a long chain has the
  summed duration and the summed flake risk of every step in it.

### §9.7 Before you call a test done

A green single run proves little here — the failures are timing-dependent. Before finishing a spec you
wrote or edited:

1. Run the file **twice**; once with `--sequence.shuffle` (`npx vitest run <file> --sequence.shuffle`)
   to flush order dependence.
2. Run `npm run lint:specs` (it runs on staged specs at commit time too). It rejects the two shapes it
   can see — `waitFor(() => expect(mock).toHaveBeenCalled…)` and any `setTimeout`. The rest it cannot
   see, so grep your diff for them: `{ timeout:`, `waitFor(() => {` containing a `click`/`type`, a
   real `GridView` in a spec that isn't about the grid, an absence assertion with no positive anchor.
3. Check the slowest test's duration in the verbose output against the §9.6 budget.
4. If it is slow, fix the cause (smaller render, stubbed grid, `findBy*`) — do not raise a timeout.
