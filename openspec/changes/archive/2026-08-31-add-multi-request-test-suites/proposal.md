## Why

A DEPLOYMENT test suite today issues exactly one HTTP request per test case per run: the suite's own
`endpointRef` / `requestTemplate` / `responseColumns` / `inputBindings` describe that single request, and
`ResultDto` carries one result row per `(testCaseId, runIndex[, turnIndex])`.

The backend (branch adding request chains to evaluation test suites) generalizes this to an ordered
**chain** of requests run in sequence against the same deployment: the suite's own request fields become
request `#0`, now labelled by a `requestName`, and a new `additionalRequests` array (max 10 entries) adds
requests `1..N`. Each chain entry is a full request definition — `name`, `endpointRef`, `requestTemplate`,
`responseColumns`, `inputBindings` — run in order, sharing the case's test data. Result rows are now keyed
by `(requestIndex, turnIndex)` in addition to `(testCaseId, runIndex)`, analytics responses carry
`requestIndex`/`totalRequests`, and metric conditions gain a `request.{index,total,last,name}` namespace
alongside the existing `turn.*` one. Response-column names are unique across the whole chain (backend-
enforced union cap of 50). MCP suites reject chains. The contract is additive and backward-compatible: a
suite with no `additionalRequests` behaves exactly as today.

This change brings a **minimal demo UI** for authoring, running, and reviewing chained requests — enough
to configure a chain, see it execute, and read its results — without touching the areas the backend
change does not require (MCP, CSV import/export, reordering, feature-flagging).

## What Changes

- **Data model.** `TestSuite`/`SuiteSnapshot` gain `requestName?: string` (labels the suite's own request
  fields as request `#0`) and `additionalRequests?: TestSuiteAdditionalRequest[]` (requests `1..N`).
  `ResultDto` gains `requestIndex?: number` and `totalRequests?: number`, mirroring the existing
  `turnIndex`/`totalTurns` pair added for multi-turn test cases.
- **Proxy-view editing.** A new pure util, `src/utils/evaluation/request-chain.ts`, projects whichever
  chain entry is selected into a `TestSuite`-shaped view (`toRequestView`) so the existing Request
  Template and Endpoint Schema editors keep editing a `TestSuite` unmodified, and writes edits back
  (`fromRequestView`) to either the suite's own top-level fields (request `#0`) or the matching
  `additionalRequests[i]` entry. No editor component is forked per chain entry.
- **Method tab.** A new `RequestChainSelector` chip strip (ui-kit `DialTag`), rendered only for DEPLOYMENT
  suites, lets the user add/remove/select a chain entry (1–11 requests total) and rename it inline. The
  selected chip drives `RequestTemplate` and `EndpointSchema` through the proxy view; both are remounted
  (keyed by request index) on switch so no editor state bleeds between requests. An info banner marks
  requests after `#0`. Try Out continues to operate on request `#0` only, regardless of the selected chip.
- **Payload normalization.** Saving a suite normalizes every chain entry's request template the same way
  the single-request body is normalized today (e.g. dropping an empty `jsonataContent`), and strips
  `requestName`/`additionalRequests` entirely from the payload for MCP suites, so a suite that was
  DEPLOYMENT with a chain and is switched to MCP cannot round-trip stale chain data.
- **Test Cases tab.** Each additional request gets its own "Dynamic configuration" section: template
  variables are derived client-side from that request's own template text (the existing
  `${{name}}`/`${{name:default}}` placeholder scan), merged with that request's own `inputBindings` — the
  same binding UI used for request `#0` today, reused once per chain entry.
  Section is not needed for request #0 — that is the existing "Dynamic configuration" section unchanged.
- **Metrics.** The `Condition` field's `ConditionHint` documentation is extended to describe the
  `request.index` (0-based) / `request.total` / `request.last` (boolean) / `request.name` namespace,
  mirroring how it already documents `turn.*`. Response-typed metric input bindings (the `DialSelect` in
  `Metrics/AddMetric/Values/Inputs.tsx`) now offer the union of response columns across the whole chain,
  not just request `#0`'s.
- **Run results grid.** Two flat columns, `Request` (1-based) and `Total requests`, are appended to the
  `EXECUTION` column group in `Runs/View/utils.ts`, mirroring the existing `Turn`/`Total turns` columns.
  No grouping, no expander — the results grid stays exactly as flat as it is today.
- **Compare pairing.** The shared row-matching keys in `Runs/View/utils.ts`
  (`getCompareIdKey`/`getCompareNameKey`, used by both the Analytics tab's "Compare with" sibling-run
  mode and the dedicated Compare Runs page) are extended from `testCaseId::runIndex` to include
  `requestIndex` and `turnIndex`, so a chained, multi-turn run pairs rows correctly on both surfaces.
- **Run summary.** The run header shows a "Requests in chain: N" row whenever the run's (or, if absent,
  the suite's) chain is non-empty, following the existing `suiteSnapshot ?? testSuite` fallback pattern.

## Capabilities

### New Capabilities

- `multi-request-test-suites`: The request-chain data model and the pure proxy-view util; the
  `RequestChainSelector` chip strip and how it drives the existing Method-tab editors unchanged; the
  info banner and Try-Out-is-request-#0-only rule; MCP rejection; save-time normalization; and the
  per-additional-request Dynamic Configuration section on the Test Cases tab.
- `multi-request-metrics`: The `request.*` condition namespace documentation and the chain-wide
  response-column union offered to Response-typed metric input bindings.
- `run-results-request-columns`: The `Request`/`Total requests` run-results columns, the guarantee that
  chained runs remain flat (no grouping), and the "Requests in chain: N" run-summary row.

### Modified Capabilities

- `runs-analytics-run-compare`: The "Rows are joined by test case identity" requirement is extended — the
  join key used to pair a current-run row with its compared-run counterpart now also matches on
  `requestIndex` and `turnIndex`, not just `runIndex`.

## Impact

**New** — `apps/ai-dial-admin/src/`
- `models/evaluation/test-suite.ts` — `TestSuiteAdditionalRequest` interface; `requestName` and
  `additionalRequests` on `TestSuite` and `SuiteSnapshot`.
- `models/evaluation/run.ts` — `requestIndex`/`totalRequests` on `ResultDto`.
- `utils/evaluation/request-chain.ts` — `getRequestCount`, `getRequestName`, `updateRequestName`,
  `toRequestView`, `fromRequestView`, `addRequest`, `removeRequestAt`, `getChainResponseColumns`.
- `components/TestSuites/RequestTemplate/components/RequestChainSelector.tsx` (or a peer location under
  `TestSuites/Methods/` — exact placement decided during implementation, see design.md) — the chip strip.

**Modified**
- `src/components/TestSuites/View/MethodTabContent.tsx` — render `RequestChainSelector` above
  `RequestTemplate`/`EndpointSchema` for DEPLOYMENT suites; thread the selected index and the proxy view.
- `src/components/TestSuites/RequestTemplate/RequestTemplate.tsx`,
  `src/components/TestSuites/EndpointSchema/EndpointSchema.tsx` — accept/forward a `key` (or an
  equivalent remount trigger) tied to the selected request index; otherwise unchanged.
- `src/utils/evaluation/test-suite-payload.ts` (`normalizeTestSuitePayload`) — normalize every chain
  entry's request template; strip `requestName`/`additionalRequests` for `SuiteType.McpTool`.
  `src/server/eval/test-suites-api.ts` calls this already — no new call site.
- `src/components/TestSuites/TestCases/TestCasesList.tsx` (and/or a new sibling section component) — one
  `DynamicConfiguration` section per additional request.
  Its own `inputBindings` and derived template variables.
- `src/components/TestSuites/Metrics/AddMetric/Values/Inputs.tsx` — Response-typed binding options read
  `getChainResponseColumns(selectedTestSuite)` instead of `selectedTestSuite?.responseColumns` directly.
- `src/constants/i18n.ts`, `src/locales/en.ts` — extend `TestSuitesI18nKey.ConditionHint`; add labels for
  the chip strip, the info banner, "add request" / "remove request" actions, and the run-summary row.
- `src/components/Runs/View/utils.ts` — two columns appended to `executionColumns`; `getCompareIdKey`/
  `getCompareNameKey` extended.
- `src/components/Runs/Summary/Header.tsx` — "Requests in chain: N" row.

**Backend contract is assumed, not verified**, exactly as the prior multi-turn change accepted: there is
no OpenAPI spec for `requestName`/`additionalRequests`/`requestIndex`/`totalRequests` in this repo. Shapes
are taken verbatim from the CONTEXT the backend branch supplies. If the real wire format differs, rework
is confined to the model files, `request-chain.ts`, and the two converters that touch the wire
(`normalizeTestSuitePayload`, the Test Cases tab's binding derivation) — the Method-tab UI is
contract-agnostic once the proxy view is in place, exactly as the multi-turn projection was.

## Non-goals

- **Request-name column in the results grid.** `Request`/`Total requests` are the only new columns;
  `requestName` itself is not surfaced per result row.
- **Per-request Try Out.** Try Out always exercises request `#0`.
- **Run CSV import UI** for chained runs.
- **Client-side validation-warning path routing** for chain limits (max 10 additional requests, the
  50-column union cap, response-column name collisions). The add-request affordance is disabled once the
  UI limit is reached; anything the backend rejects surfaces through the existing save-error-toast path,
  unchanged.
- **Export UI changes.** Export is already header-name-driven and needs no chain-specific code.
- **MCP chaining.** MCP suites cannot carry a chain; the selector does not render for them.
- **Chain reordering.** Requests run in array order; there is no drag-and-drop or move-up/move-down.
- **A feature flag.** The change is additive and backward-compatible, like the multi-turn change before
  it — no flag needed.
