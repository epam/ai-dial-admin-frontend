# Row-based multi-turn — frontend integration (write side + result-DTO fields)

**Date:** 2026-07-14
**Branch:** `feature/multi-turn-support-2` (base: `development`)
**Status:** approved for implementation — POC iteration

## 1. Context

Backend reworked multi-turn conversation evaluation to a **row-based** model: a conversation is an
ordered group of ordinary test-case rows (one row per turn) sharing a `conversationId`, ordered by
`turnIndex` (0-based, contiguous). A row with both `conversationId` and `turnIndex` null is a normal
single-turn test case. Multi-turn is emergent from the data — **no suite-level flag**.
`conversationId`/`turnIndex` are **top-level** test-case fields, siblings of `data`, never inside it,
so they are never template/binding variables.

**Baseline reality (important):** the earlier design doc
(`2026-07-14-row-based-multi-turn-frontend-design.md`) was written against
`experimental/multi-turn-conversations`, which already had a suite-level `multiTurn` flag and
result-grid turn columns. On `development` **none of that exists**: no `multiTurn` field anywhere, no
`turnIndex`/`totalTurns` on result DTOs. Its file paths are also stale — test cases are authored under
`Datasets/` as well as `TestSuites/`. That doc is used only for UX intent; the HTML API contract is the
source of truth for the API.

## 2. Scope

**In scope (this iteration):**

- Add `conversationId`/`turnIndex` to test-case models; carry them through create / read / PUT-batch
  round-trip, guarded **both-or-neither**.
- Two inline-editable grid columns (`conversationId`, `turnIndex`) — manual entry, no client-side
  validation.
- Wire **both** live authoring grids (they both author dataset test cases via the same
  `createTestCase(datasetId, …)` action):
  - `TestSuites/` — `TestSuites/utils/{data.ts,columns.tsx}`, `TestSuites/TestCases/TestCasesList.tsx`.
  - `Datasets/` — `Datasets/utils/{data.ts,columns.tsx}`, `Datasets/TestCases/TestCasesList.tsx`.
- CSV import preview: extend `RowMapping` type with the reserved columns (backend-driven).
- Add `turnIndex`/`totalTurns` to `ResultDto` — **data plumbing only** (fields available downstream; no
  rendering/grouping this iteration).

**Out of scope (explicit):** results-grid grouping-by-`traceId`, broken `0/0` ERROR row rendering,
last-turn detection, MCP-suite 409 special handling, conversation-count UI, conversation-builder /
group-ungroup affordances, auto-UUID / auto-index / contiguity validation. `multiTurn` rollback is
**not applicable** (it does not exist on `development`). Bulk PATCH stays `{ testCaseName, data }`.
Analytics eval-summary batch-write (§2.5 of the contract) — frontend only does eval-summary *export*,
not batch-write, so no change.

## 3. Contract facts the wiring rests on

- Test-case DTOs gain `conversationId` (UUID string | null), `turnIndex` (int | null). Both-or-neither
  on write (exactly one → 400). Omitted on responses when null.
- Not settable via bulk PATCH (whitelist unchanged).
- `numberOfTestCases` = runnable-**conversation** count; read as-is, no client recomputation.
- New write-time errors surfaced as-is via existing generic toasts: 400 `VALIDATION_ERROR`
  (grouping-field rules), 409 `UNIQUE_CONSTRAINT_VIOLATION` (duplicate `(conversationId, turnIndex)`).
- Result/summary DTOs expose `turnIndex` (0-based; single-turn = 0) and `totalTurns` (single-turn = 1;
  broken = 0). Group-by-`traceId` and broken-row handling deferred.

## 4. Design

### 4.1 Models
- `src/models/evaluation/dataset.ts` → `DatasetTestCase`: `conversationId?: string | null;`,
  `turnIndex?: number | null;`.
- `src/models/evaluation/test-suite.ts` → `TestCase`: same two fields.
- `src/models/evaluation/run.ts` → `ResultDto`: `turnIndex?: number;`, `totalTurns?: number;`
  (plumbing; `traceId` already exists on `ExtractionResult.executionInfo`).

### 4.2 Round-trip wiring (both util sets)
- `rowToTestCase` (`TestSuites/utils/data.ts`) and `rowToDatasetTestCase` (`Datasets/utils/data.ts`):
  **both-or-neither guard** — include both fields only when `conversationId` is a non-empty string
  **and** `turnIndex` is a finite number; otherwise omit both keys entirely. `turnIndex: 0` counts as
  present (falsy-but-valid).
- `getTestCaseGridData` / `getDatasetTestCaseGridData`: already spread `...testCase`; fields land on the
  row automatically — no code change, add passthrough test.
- `onCellChange` in both `TestCasesList.tsx`: add `conversationId` and `turnIndex` to the field-exclusion
  set so they are written to the **top-level** row object, not merged into `data`.

### 4.3 Authoring columns (both column sets)
- In `getTestCaseColumns` (`TestSuites/utils/columns.tsx`) and `getDatasetTestCaseColumns`
  (`Datasets/utils/columns.tsx`) add, near the identity columns:
  - `turnIndex` — `EditableCellRenderer`, `inputType: 'number'`, integer step; `valueGetter` reads
    top-level `params.data?.turnIndex`.
  - `conversationId` — `EditableCellRenderer` (text); `valueGetter` reads top-level
    `params.data?.conversationId`.
  - Both route `onChange` through the component's `onCellChange`; both respect `isReadOnly` where the
    column set supports it.

### 4.4 CRUD API types
- Widen `createTestCase` body from `Pick<…,'testCaseName'|'data'>` to additionally allow
  `conversationId`/`turnIndex` in `server/eval/datasets-api.ts`, `server/eval/test-suites-api.ts`, and
  the `app/[lang]/datasets/actions.ts` wrapper.
- `updateTestCases` (PUT batch): no signature change — sends full `DatasetTestCase[]`; fields flow via
  the guard.
- Bulk PATCH: unchanged.

### 4.5 CSV import preview
- Extend `RowMapping` (`TestSuites/TestCases/Import/models.ts`, shared by the Datasets import modal)
  with optional `conversationId`/`turnIndex`. Backend returns/handles the reserved columns; verify they
  render and stay out of `data`. No request change.

### 4.6 Errors & counts — no new code
- New 400/409 surface through existing generic error toasts on save/create.
- `numberOfTestCases` read as-is.

## 5. Testing
- `rowToTestCase` / `rowToDatasetTestCase`: both present → both included; exactly one → both omitted;
  none → both omitted; `turnIndex: 0` → present.
- grid-data passthrough: `conversationId`/`turnIndex` on the source test case appear on the grid row.
- columns: both column sets include the two editable columns; editable when not read-only; `valueGetter`
  reads top-level; `onChange` routes through `onCellChange`.
- component (`onCellChange`): editing `conversationId`/`turnIndex` writes top-level, never into `data`.

## 6. Risks / notes
- Both-or-neither guard lives only in `rowTo*`; any other save path must apply the same rule. Currently
  PUT batch is the only edit path; create goes through `createTestCase`.
- Manual UUID/index entry is deliberate for the POC; auto-generation and contiguity validation are a
  future iteration.
