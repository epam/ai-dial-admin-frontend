## Context

A DEPLOYMENT test suite's Method tab (`src/components/TestSuites/View/MethodTabContent.tsx`) renders,
for the non-MCP branch (`DeploymentMethodContent`):

```tsx
<MethodEndpoint testSuite={testSuite} showFormattedUrl />
...
<TryOutButton testSuite={testSuite} />
...
<RequestTemplate testSuite={testSuite} onChangeTestSuite={onChange} />
<EndpointSchema testSuite={testSuite} onChangeTestSuite={onChange} isSkipRefresh={isSkipRefresh} />
```

`RequestTemplate` and `EndpointSchema` both take a whole `TestSuite` and read/write
`testSuite.requestTemplate` / `testSuite.endpointRef` / `testSuite.responseColumns` /
`testSuite.inputBindings` directly — there is exactly one request's worth of fields on the model, and
every editor under these two components (`BodyTab`, `ParamsTab`, `FormDataGrid`, `JsonataToggle`,
`ContentTypeSelect`, `EndpointSchema`'s columns grid, `DynamicConfiguration`/`VariableRow`) is written
against that assumption.

The backend generalizes this to a chain: the suite's own four fields become request `#0` (now labelled by
a new `requestName`), and `additionalRequests: TestSuiteAdditionalRequest[]` (max 10) holds requests
`1..N`, each shaped identically to request `#0`'s four fields plus its own `name`. `ResultDto` gains
`requestIndex`/`totalRequests`, following the exact precedent set by `turnIndex`/`totalTurns` (added by
the prior multi-turn-test-cases change, `src/models/evaluation/run.ts:12-13`) and consumed the same way in
`Runs/View/utils.ts`'s `executionColumns` (`turnIndex` at line 152, rendered 1-based via a `+1`
`valueGetter`, exactly mirroring the pre-existing `runIndex` column).

Two other pieces of prior art carry directly into this change:

- `test-suite-jsonata-request-body`'s **body-text-owned-above-the-editor** pattern
  (`src/components/TestSuites/utils/body-content.ts`, `RequestTemplate.tsx`'s `bodyText` state) is what
  makes body editing safe to point at *any* request's body — the text is derived from whichever body the
  parent hands it, and the parent (here, the proxy view) decides which body that is.
- `multi-turn-test-cases`'s **shared-vs-per-turn Dynamic Configuration reuse** is the direct precedent for
  reusing `DynamicConfiguration`/`VariableRow` once per additional request rather than forking it: the
  component already takes `rows`/`schema`/`onChangeValue` as props and has no suite-shaped state of its
  own.

`normalizeTestSuitePayload` (`src/utils/evaluation/test-suite-payload.ts`) already normalizes
`requestTemplate.body` before every `PUT` (dropping an empty `jsonataContent`); this is the existing
single seam to extend for per-chain-entry normalization and for MCP stripping, and the only place that
runs on every save regardless of which UI path produced the suite object.

## Goals / Non-Goals

**Goals**

- Add, remove, rename, and select a chain entry from the Method tab, with the existing Request Template
  and Endpoint Schema editors doing the actual editing — no forked editor tree per request.
- Editing one request cannot leak into another: switching the selected chip must not carry over draft
  state (a half-typed URL, an open accordion) from the previously selected request.
- Test Cases tab, Metrics tab, run results, and run comparison each pick up the chain with the smallest
  change that keeps their existing contracts intact for a suite with an empty chain.
- A suite with no `additionalRequests` is pixel- and behavior-identical to today's suite.

**Non-Goals**

- Chain reordering, per-request Try Out, MCP chaining, CSV import UI for chains, a feature flag — see
  proposal.md's Non-goals for the full list and rationale.
- Enforcing the backend's chain limits (10 additional requests, 50-column response union, unique
  column names across the chain) beyond a simple UI cap on "Add request". These are backend-owned
  validations; this change does not add a new warning-surfacing path for them.

## Decisions

### The suite's own fields stay in place; the proxy view is one-directional per edit

Request `#0` is **not** moved into `additionalRequests[0]` or any parallel array — `TestSuite.endpointRef`
/ `requestTemplate` / `responseColumns` / `inputBindings` keep meaning "request #0" exactly as they do
today, now simply *labelled* by the new `requestName`. This is the cheapest way to guarantee the
"unchanged for an empty chain" goal: every existing reader of those four fields (Try Out, the Method tab
before this change, `normalizeTestSuitePayload`, `getChainResponseColumns`'s degenerate case) needs no
migration.

`toRequestView(testSuite, index)` returns a `TestSuite` whose `endpointRef`/`requestTemplate`/
`responseColumns`/`inputBindings` are swapped to reflect chain entry `index` — `testSuite` itself
untouched for `index === 0`, or borrowed from `additionalRequests[index - 1]` otherwise — with every other
field (`id`, `name`, `suiteType`, `deploymentRef`, ...) passed through unchanged, since `RequestTemplate`/
`EndpointSchema` never read those for anything chain-specific.

`fromRequestView(testSuite, index, editedView)` is the inverse: it takes the *edited* view (what
`onChangeTestSuite` received) and writes its four request fields back — onto `testSuite`'s own top level
for `index === 0`, or into a copy of `additionalRequests[index - 1]` otherwise — returning a new
`TestSuite` with every non-request field taken from the **original** `testSuite`, not from `editedView`.
This asymmetry matters: `editedView` is a `TestSuite`-shaped object that exists only so the unmodified
editors have something to call `onChangeTestSuite` with; it must never be mistaken for the real suite.

### Chip strip owns "which request is selected"; it is transient UI state

`RequestChainSelector` holds `selectedIndex` as local `useState` (default `0`), not on the suite. There is
nothing to persist — reopening the suite always starts at request `#0`. The selector calls
`toRequestView(testSuite, selectedIndex)` to produce what it hands `RequestTemplate`/`EndpointSchema`, and
wraps `onChangeTestSuite` so every edit routes through `fromRequestView(testSuite, selectedIndex, edited)`
before reaching `MethodTabContent`'s own `onChange`.

### Editors remount on chip switch via `key`

`RequestTemplate` owns `bodyText` as `useState`, seeded once on mount from the body it is given
(`test-suite-jsonata-request-body`'s existing contract). Switching the selected chip hands it a
*different* body without unmounting it by default, which would leave `bodyText` stale — the exact
failure mode the JSONata design doc calls out for content-type switches, solved there by an explicit
reseed. Chain switching reseeds by the blunter, already-idiomatic React mechanism instead: both
`RequestTemplate` and `EndpointSchema` are rendered with `key={selectedIndex}` at the call site in
`MethodTabContent`, so a chip switch **unmounts and remounts** rather than reusing state. This is a
one-line change at the render site and needs nothing new inside either component. `EndpointSchema`'s own
internal state (its columns grid's `isSkipRefresh` edit buffer) resets the same way, for the same reason.

### The info banner and the Try-Out restriction are read-only facts about the selection, not new state

`selectedIndex > 0` is the entire condition for the info banner — no suite field records it. Try Out is
simplest left **untouched**: `TryOutButton` and `TryOut.tsx` already read `testSuite.requestTemplate`/
`endpointRef` directly rather than through the proxy view, so as long as neither is threaded the
selected-request view, Try Out keeps exercising request `#0` with zero code change beyond leaving it
outside the chip-strip's wiring. The alternative — passing the selected view into Try Out and disabling
the button for `index > 0` — was rejected as strictly more code for the same visible behavior.

### Test Cases tab: one Dynamic Configuration section per additional request, none added for request #0

Request `#0`'s "Dynamic configuration" section is the one that exists today, wired to
`testSuite.inputBindings` — unchanged. For each entry in `additionalRequests`, a new section renders the
same `DynamicConfiguration` component, given:

- `rows`: that entry's own `inputBindings`, converted to `InputBindingRowData` the same way the existing
  section does;
- template variables: derived **client-side** from that entry's `requestTemplate` via the existing
  placeholder regex (`${{name}}` / `${{name:default}}`, the same scan `test-suite-jsonata-request-body`
  documents for the JSONata body and `getTemplateParameters` already performs for the single-request
  case) — scanning that request's URL, headers, query params, and body text, exactly as done for request
  `#0` today, just re-run per chain entry instead of once.

No new binding-derivation logic is needed; the existing per-suite scan is simply invoked once per chain
entry instead of once per suite. Section headers use each entry's `name` (falling back to a "Request N"
default), so a user can tell which request's bindings they are editing.

### Response-column union for metrics is a pure fold, not a new fetch

`getChainResponseColumns(testSuite)` concatenates `testSuite.responseColumns` with every
`additionalRequests[i].responseColumns`, in chain order. It deliberately does **not** de-duplicate by
`name`: response-column names are already guaranteed globally unique across the chain by the backend (the
50-column union cap and name-collision rejection are both backend-enforced and surfaced on save through
the existing error-toast path), so a client-side dedup would be solving a problem the client will never
actually see, and would risk silently hiding a real backend validation error behind an inconsistent local
choice of "which one wins." `Metrics/AddMetric/Values/Inputs.tsx`'s `DialSelect` for
`MetricBindingType.Response` switches from `selectedTestSuite?.responseColumns` to
`getChainResponseColumns(selectedTestSuite)`; for a suite with no `additionalRequests` the two produce
the same list, so this is a strict superset with no behavior change for today's suites.

### MCP stripping happens at the same seam as body normalization, not in the UI

`RequestChainSelector` simply never renders on the MCP branch of `MethodTabContent` (`isMcp` is already
computed there) — that alone prevents a user from *building* a chain on an MCP suite through the UI.
But a suite can still carry stale `additionalRequests` after a suite is switched from DEPLOYMENT to MCP
mid-edit (the existing "Change method" modal reassigns `suiteType` without clearing unrelated fields), so
`normalizeTestSuitePayload` — the single function every save already routes through — also strips
`requestName` and `additionalRequests` whenever `suiteType === SuiteType.McpTool`, mirroring how it
already strips an empty `jsonataContent`. This keeps "an MCP suite never sends chain fields" true
regardless of UI path, without adding a second enforcement point.

### Compare pairing: extend the existing key, do not add a second one

`getCompareIdKey`/`getCompareNameKey` in `Runs/View/utils.ts` already encode `runIndex` into the join key
(`${testCaseId}::${runIndex}`) specifically so a re-run test case does not collide with itself across
comparison. `requestIndex` and `turnIndex` are additional dimensions of the exact same kind — extending
the same two key functions to
`` `${testCaseId}::${runIndex}::${requestIndex ?? 0}::${turnIndex ?? 0}` `` (and the name-keyed fallback
identically) is a two-function change that both the Analytics tab's "Compare with" mode and the dedicated
Compare Runs page (`ExecutionResultsTab.tsx`, which imports `mergeByTestCaseId` from the same module) pick
up for free, since both already funnel through `mergeByTestCaseId`. The `?? 0` defaulting is what keeps a
non-chained, non-multi-turn run's key identical to today's, satisfying "backward compatible."

### Run summary row reads the snapshot first, the suite second — same fallback as today's Header

`Header.tsx` already computes `run.suiteSnapshot ?? testSuite` once, for `getSuiteApplicationName`. The
new "Requests in chain: N" row reads chain length off the same `suiteContext` — `N = 1 +
(suiteContext?.additionalRequests?.length ?? 0)` — and the row is omitted entirely when `N === 1`, so a
non-chained run's header is unchanged. Using the run's frozen `suiteSnapshot` rather than the live
`testSuite` means the row reports the chain **as it was when the run started**, consistent with every
other snapshot-sourced field on that header.

## Risks / Trade-offs

- **Backend contract is unverified**, exactly as the multi-turn change accepted for its own fields. Risk
  is isolated to the model files, `request-chain.ts`, and `normalizeTestSuitePayload` — the Method-tab UI
  is contract-agnostic once the proxy view exists.
- **`key`-based remount is a blunt instrument.** It is correct and simple, but it means any grid/editor
  scroll position or open accordion inside `RequestTemplate`/`EndpointSchema` resets on every chip switch.
  Accepted: these are small, single-request editors, not long scrolling grids, so the cost is low and the
  alternative (an explicit per-component reseed effect, as JSONata's content-type switch uses) is more
  code for the same user-visible outcome here.
- **`getChainResponseColumns` does no collision handling**, so if the backend ever returned a name
  collision it should have rejected, the same label would appear twice in the selector rather than the
  client silently picking a winner. Accepted deliberately: the backend owns uniqueness and surfaces a
  violation as a save error, so a client-side dedup would only mask that error behind an arbitrary local
  choice, not fix anything.
- **The whole-run Compare Runs page and the Analytics tab's sibling-run compare share one join-key
  implementation.** Extending it benefits both, but also means a bug in the new key dimensions surfaces
  on two screens at once. Mitigated by unit-testing the key functions directly rather than only through
  either screen's integration tests.

## Migration Plan

Additive and backward-compatible, exactly like the multi-turn change:

- A `TestSuite`/`SuiteSnapshot` with no `additionalRequests` renders no chip strip beyond a single,
  unremovable "request #0" chip (or the chip strip can choose to render nothing at all for a
  single-request suite — implementation detail, either is invisible to the user in practice) and behaves
  exactly as today.
- A `ResultDto` with no `requestIndex`/`totalRequests` renders both new grid columns empty.
- A join key with `requestIndex`/`turnIndex` both `undefined` collapses to today's `runIndex`-only key via
  the `?? 0` defaulting.
- No data migration, no feature flag, no backfill.

## Open Questions

- Exact file location for `RequestChainSelector` — this design assumes a peer of `RequestTemplate` under
  `components/TestSuites/RequestTemplate/components/`, but it could equally live under
  `components/TestSuites/Methods/` alongside `MethodEndpoint`/`MethodInfo`. Decide during implementation
  by whichever reads more naturally next to `MethodTabContent`'s existing imports.
- Whether the chip strip should render at all for a suite with zero `additionalRequests` (a single
  unremovable chip vs. nothing) is left to implementation/UX judgment — both satisfy every acceptance
  scenario in this change.
- Whether `getRequestName`'s fallback label is `Request {index + 1}` or reuses some existing "Request N"
  string already in `locales/en.ts` — check for a reusable key before adding a new one, per
  `.claude/rules/components.md` §10.
