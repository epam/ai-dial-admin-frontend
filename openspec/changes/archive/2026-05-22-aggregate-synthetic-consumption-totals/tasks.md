## 1. Implement rollup pass

- [x] 1.1 In `apps/ai-dial-admin/src/utils/entities-consumption-tree.ts`, add a pure function `aggregateSyntheticRows(tree: TreeRow<EntityRow>[]): void` that walks the tree post-order and, for each node where `synthetic === true`, sets `requests`, `prompts`, `completions`, and `deployment_cost` to the sum of the corresponding direct-child values (parsed via `Number(child[field] ?? '0')`, written back via `String(total)`); leaves `cost` at `'0'`.
- [x] 1.2 Call `aggregateSyntheticRows(tree)` from `buildEntitiesConsumptionTree` immediately after `buildTreeFromParentPointer`, before returning the tree. Do not change the function signature or any other caller in `EntitiesConsumptionTree.tsx`.
- [x] 1.3 Guard against the empty-children edge case: a synthetic row with `children.length === 0` SHALL retain `'0'` in every numeric field (matches the spec's "Synthetic row with no children stays at zero" scenario).

## 2. Update existing unit tests for the new synthetic-row behavior

- [x] 2.1 In `apps/ai-dial-admin/src/components/Telemetry/tests/EntitiesConsumptionTree.spec.tsx`, audit every assertion that currently expects a synthetic row to show `0` in `requests`, `prompts`, `completions`, or `deployment_cost`, and update the expected value to the direct-children rollup (use the row fixtures already defined in each test, e.g. the `Ocr` synthetic with three children at `count: 34`, `11`, `8` should now expect `requests: '53'`). _Verified: the file's mocked TreeGrid only exposes `data-row-count` / `data-summary`, never numeric values — no assertions to update._
- [x] 2.2 Keep assertions for synthetic-row `cost` at `'0'` and for italic/`(+N)` Name-column rendering — those still hold. _N/A: file does not assert any numeric or styling values._
- [x] 2.3 Do not change any assertion for real rows; real-row values must remain backend-verbatim per the modified `Rows display backend values as-is` requirement. _N/A: no numeric assertions present; structural assertions untouched._

## 3. Add new unit tests covering the duplication scenarios

- [x] 3.1 Add a unit test file `apps/ai-dial-admin/src/utils/tests/entities-consumption-tree.spec.ts` (if it doesn't already exist; otherwise extend it) that imports `buildEntitiesConsumptionTree` and `aggregateSyntheticRows` directly and exercises pure-function behavior without rendering.
- [x] 3.2 Test "direct-children rule avoids double-counting deployment_cost": synthetic root → real child B (`deployment_cost: '60'`) → real grandchild C (`deployment_cost: '20'`); assert root's `deployment_cost === '60'`, NOT `'80'`.
- [x] 3.3 Test "tokens don't double-count across orchestrator/model layers": synthetic root → real orchestrator (`prompts: '100'`) → real model (`prompts: '100'`); assert root's `prompts === '100'`, NOT `'200'`.
- [x] 3.4 Test "nested synthetic ancestor reads child synthetic's already-computed totals": synthetic Outer → synthetic Inner → two real grandchildren with `requests: '5'` and `'7'`; assert Inner's `requests === '12'` and Outer's `requests === '12'` (bottom-up correctness). _Note: constructed directly because `withSyntheticAncestors` only synthesizes one ancestor level per input row; the rollup function itself must remain correct under arbitrary nesting._
- [x] 3.5 Test "real rows are not modified": a real row with `requests: '50'`, `cost: '2'`, `deployment_cost: '7'` and children with non-zero values must retain all original backend values after the pass.
- [x] 3.6 Test "synthetic row with no children stays at zero": defensive case where `withSyntheticAncestors` produces a synthetic with empty children — every numeric field stays `'0'`.

## 5. Synthetic-name fallback when parent_deployment is "undefined"

- [x] 5.1 Add `lastSegmentOfPath(path)` helper to `apps/ai-dial-admin/src/utils/entities-consumption-tree.ts` that returns the final segment of an execution path while respecting `\/` escapes (so `'x/a\\/b'` yields `'a/b'`).
- [x] 5.2 Add `resolveParentName(rawParentDeployment, parentPath)` helper that returns the trimmed value when it's a non-empty, non-`'undefined'` string; otherwise returns `lastSegmentOfPath(parentPath)`.
- [x] 5.3 Use `resolveParentName` in BOTH `withSyntheticAncestors` (when picking `synthetic.name`) AND `buildEntitiesConsumptionTree`'s `getParentId`, so the synthetic's id and each child's parent-id reference the same value.
- [x] 5.4 Unit-test `lastSegmentOfPath` for single segment, multi-segment, escaped `\/`, and empty inputs.
- [x] 5.5 Unit-test `resolveParentName` for valid names, the literal `'undefined'`, empty string, `undefined` value, and whitespace.
- [x] 5.6 Integration test (through `buildEntitiesConsumptionTree`): row with `parent_deployment: 'undefined'` and `execution_path: 'mystery-parent/leaf'` produces a synthetic named `'mystery-parent'` with `leaf` as its child.
- [x] 5.7 Integration test (escaped slash): row with `execution_path: 'x/a\\/b/grandchild'` and `parent_deployment: 'undefined'` produces a synthetic named `'a/b'`.
- [x] 5.8 Regression test: a row whose `parent_deployment` is a normal value (e.g. `'Ocr'`) is unaffected.
- [x] 5.9 Regression test: a true root row (`parent_deployment: 'undefined'`, `execution_path` equal to deployment) creates NO synthetic and renders as a root.

## 4. Quality gate

- [x] 4.1 Run `npx vitest run src/utils/tests/entities-consumption-tree.spec.ts src/components/Telemetry/tests/EntitiesConsumptionTree.spec.tsx` from `apps/ai-dial-admin/` and confirm all pass. _Result: 20/20 passed._
- [x] 4.2 Run `npm run lint` and `npm run format` at the repo root; fix any reported issues. _Lint: 0 errors (30 pre-existing warnings, none in changed files). Prettier: all files match._
- [x] 4.3 Run the full `npm run test` at the repo root and confirm no regressions in unrelated suites. _Result: 4994 passed, 9 skipped, 0 failures across 498 test files._
