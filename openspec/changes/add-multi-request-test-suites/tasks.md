## 1. Foundation — models and pure utils

- [ ] 1.1 Add `TestSuiteAdditionalRequest` in `src/models/evaluation/test-suite.ts`: `name?: string`,
  `endpointRef?: TestSuiteEndpointRef`, `requestTemplate?: TestSuiteRequestTemplate`,
  `responseColumns?: ResponseColumn[]`, `inputBindings?: InputBinding[]`. Add `requestName?: string` and
  `additionalRequests?: TestSuiteAdditionalRequest[]` to `TestSuite` and `SuiteSnapshot`. Document once,
  on `TestSuite`, that request `#0` is the suite's own existing four fields and `additionalRequests` holds
  requests `1..N` — do not repeat this at each call site (per `.claude/rules/code-standards.md`).
- [ ] 1.2 Add `requestIndex?: number` and `totalRequests?: number` to `ResultDto` in
  `src/models/evaluation/run.ts`, alongside the existing `turnIndex`/`totalTurns`.
- [ ] 1.3 Add `src/utils/evaluation/request-chain.ts`: `getRequestCount(testSuite): number`,
  `getRequestName(testSuite, index): string` (with a fallback label for an entry with no `name`),
  `updateRequestName(testSuite, index, name): TestSuite`, `toRequestView(testSuite, index): TestSuite`,
  `fromRequestView(testSuite, index, editedView): TestSuite`, `addRequest(testSuite): TestSuite` (no-op
  once the chain has 11 requests), `removeRequestAt(testSuite, index): TestSuite` (index `>= 1` only),
  `getChainResponseColumns(testSuite): ResponseColumn[]` (concatenates request `#0`'s `responseColumns`
  with each `additionalRequests[i].responseColumns` in chain order — no de-duplication; the backend
  guarantees globally unique names across the chain and rejects a collision on save). Follow
  `.claude/rules/utils.md` for purity/determinism.
  - **Verification:** `npx vitest run src/utils/evaluation/tests/request-chain.spec.ts` (run from
    `apps/ai-dial-admin/`). Cover: `toRequestView`/`fromRequestView` round trip for index `0` and index
    `> 0`; `fromRequestView` never takes non-request fields from the edited view; `addRequest` capped at
    11 total; `removeRequestAt` rejects index `0`; `getChainResponseColumns` concatenates in chain order
    with no de-duplication; a suite with no `additionalRequests` behaves as request-count `1`.

## 2. Payload normalization and i18n

- [ ] 2.1 In `src/utils/evaluation/test-suite-payload.ts` (`normalizeTestSuitePayload`), normalize every
  `additionalRequests[i].requestTemplate` the same way `requestTemplate` is normalized today (e.g.
  dropping an empty `jsonataContent`), and strip `requestName`/`additionalRequests` from the payload
  entirely when `suiteType === SuiteType.McpTool`.
  - **Verification:** extend `src/utils/evaluation/tests/test-suite-payload.spec.ts` — empty
    `jsonataContent` dropped from both request `#0` and an additional request; MCP suite payload omits
    `requestName`/`additionalRequests` even when present on the in-memory suite; a DEPLOYMENT suite's
    chain is sent unchanged including normalized entries.
- [ ] 2.2 Extend `TestSuitesI18nKey.ConditionHint` in `src/locales/en.ts` to document the `request.*`
  namespace (`request.index`, `request.total`, `request.last`, `request.name`), alongside the existing
  `turn.*` documentation. Add labels for the chip strip's add/remove/rename actions, the info banner, and
  the run-summary "Requests in chain" row to `src/constants/i18n.ts` + `src/locales/en.ts` — check
  `BasicI18nKey`/`ButtonsI18nKey`/`EntitiesI18nKey` for reusable labels first.

## 3. Method tab — chain selector and proxy-view editing

- [ ] 3.1 Add `RequestChainSelector` (location decided per design.md's open question — likely
  `src/components/TestSuites/RequestTemplate/components/RequestChainSelector.tsx`): a `DialTag` chip per
  chain entry, add/remove/select/rename affordances, wired to `request-chain.ts`. Selected index is local
  `useState`, not persisted on the suite.
- [ ] 3.2 Wire `RequestChainSelector` into `src/components/TestSuites/View/MethodTabContent.tsx`'s
  `DeploymentMethodContent` only (never for the MCP branch). Render `RequestTemplate` and
  `EndpointSchema` with `toRequestView(testSuite, selectedIndex)` and a `key={selectedIndex}` (or
  equivalent remount trigger), routing their `onChangeTestSuite` through
  `fromRequestView(testSuite, selectedIndex, edited)` before calling the tab's own `onChange`.
- [ ] 3.3 Add the info banner, shown iff `selectedIndex > 0`.
- [ ] 3.4 Confirm `TryOutButton`/`TryOut.tsx` are left unwired to the proxy view (they must keep reading
  `testSuite.requestTemplate`/`endpointRef` directly) — no code change expected here beyond verifying it.
  - **Verification:** `npx vitest run src/components/TestSuites/RequestTemplate/tests/RequestChainSelector.spec.tsx src/components/TestSuites/View/tests/MethodTabContent.spec.tsx`.
    Cover: selector hidden for MCP suites; add/remove/select/rename; add disabled at 11 requests; remove
    not offered on request `#0`; switching chips does not carry over uncommitted editor text (mount/
    unmount via `key`); banner shown only for `selectedIndex > 0`; Try Out unaffected by the selected
    chip.

## 4. Test Cases tab — per-request Dynamic Configuration

- [ ] 4.1 In `src/components/TestSuites/TestCases/TestCasesList.tsx` (or a new sibling section
  component), render one additional `DynamicConfiguration` section per `additionalRequests[i]`, deriving
  template variables from that entry's `requestTemplate` via the existing placeholder scan and binding
  rows from that entry's own `inputBindings`. Leave request `#0`'s existing section untouched.
  - **Verification:** extend the relevant `TestCasesList` test file (or add
    `src/components/TestSuites/TestCases/tests/AdditionalRequestBindings.spec.tsx`). Cover: a placeholder
    in an additional request's template produces a binding row in that request's own section; sections
    for different chain entries are independent; a suite with no `additionalRequests` shows only the
    existing single section.

## 5. Metrics — chain-wide response columns

- [ ] 5.1 In `src/components/TestSuites/Metrics/AddMetric/Values/Inputs.tsx`, replace the direct read of
  `selectedTestSuite?.responseColumns` (Response-typed binding's `DialSelect` options) with
  `getChainResponseColumns(selectedTestSuite)`.
  - **Verification:** extend `src/components/TestSuites/Metrics/AddMetric/Values/tests/Inputs.spec.tsx` —
    a column from `additionalRequests[i].responseColumns` is offered; a single-request suite's options
    are unchanged; columns are offered in chain order (request `#0`, then each additional request).

## 6. Run results and comparison

- [ ] 6.1 Append `requestIndex` (headerName `Request`, 1-based `valueGetter`) and `totalRequests`
  (headerName `Total requests`) to `executionColumns` in `src/components/Runs/View/utils.ts`, following
  the exact pattern of the existing `turnIndex`/`totalTurns` columns (reuse `fixedWidthColDef` and
  `NO_FILTER_COL_DEF`; add matching width constants beside `TURN_INDEX_COLUMN_WIDTH`/
  `TOTAL_TURNS_COLUMN_WIDTH`). Change nothing else in `Runs/View/` — no grouping, no expander, no default
  sort change, per the same scope boundary multi-turn results established.
- [ ] 6.2 Extend `getCompareIdKey`/`getCompareNameKey` in the same file from
  `` `${testCaseId}::${runIndex}` `` to include `requestIndex` and `turnIndex` (defaulted to `0` when
  absent), so `mergeByTestCaseId` — consumed by both the Analytics tab's "Compare with" mode and the
  Compare Runs page's `ExecutionResultsTab.tsx` — pairs rows by the full key.
- [ ] 6.3 Add a "Requests in chain: N" row to `src/components/Runs/Summary/Header.tsx`, `N = 1 +`
  `(suiteContext?.additionalRequests?.length ?? 0)` using the header's existing
  `run.suiteSnapshot ?? testSuite` fallback, omitted when `N === 1` or the chain length is undeterminable.
  - **Verification:** extend `src/components/Runs/View/tests/utils.spec.ts` — Request renders
    `requestIndex + 1`; both new columns render empty when absent; `getCompareIdKey`/`getCompareNameKey`
    pair chained/multi-turn rows correctly and collapse to today's key when both new fields are absent.
    Extend `src/components/Runs/Summary/tests/Header.spec.tsx` — chain-size row shown/omitted per
    scenario, sourced from the snapshot not the live suite.

## 7. Full-suite tests and regression

- [ ] 7.1 Regression pass: a suite with an empty chain is pixel- and behavior-identical to today on the
  Method tab, Test Cases tab, Metrics tab, run results, and run comparison. Add/confirm at least one test
  per surface asserting this.
- [ ] 7.2 `src/utils/evaluation/tests/request-chain.spec.ts` (from task 1.3) is complete and covers every
  function's boundary conditions listed there.

## 8. Quality checks

- [ ] 8.1 `npm run lint`, `npm run format`, `npm run test` (all from `apps/ai-dial-admin/` unless run via
  the repo-root scripts, which already `cd` appropriately). Do not skip the pre-commit or pre-push hooks.
  Confirm 0 new lint errors/warnings and no new failing tests beyond this change's own additions.
