# Row-based multi-turn — frontend integration design

**Date:** 2026-07-14
**Branch:** `experimental/multi-turn-conversations`
**Status:** approved for implementation planning

## 1. Context

The backend reworked multi-turn conversation evaluation from an **array-per-column** model
(a single test case whose columns held arrays, toggled by a suite-level `multiTurn` flag) to a
**row-based** model:

- A conversation is an ordered group of ordinary test-case rows — one row per turn — sharing a
  `conversationId` and ordered by `turnIndex` (0-based, contiguous from 0).
- A row with both `conversationId` and `turnIndex` null is a normal single-turn test case.
- Multi-turn is emergent from the data. There is **no suite-level flag** anymore.
- `conversationId` / `turnIndex` are **top-level** test-case fields, siblings of `data` — never inside
  `data`, so they are never template/binding variables.

This document covers the **frontend integration** for that contract change, scoped to one iteration.

## 2. Scope

**In scope:**

- Add `conversationId` / `turnIndex` to test-case models and carry them through the create / read /
  update (PUT batch) round-trip.
- Minimal authoring UI: two inline-editable grid columns (`conversationId`, `turnIndex`).
- Roll back the old suite-level `multiTurn` flag (model field, toggle UI, its i18n).
- CSV import preview: type + verify the reserved columns pass through (backend-driven).

**Out of scope (explicitly):**

- Any change to **results display**. The run-results grid's Turn / Total-turns columns and default
  sort added earlier on this branch **stay as-is**.
- Metrics-definition per-turn conditions (`Condition` / `ConditionHint`, `turn.index/total/last`,
  `isLastTurn()`) — **kept**, not rolled back.
- Error copy/wording beyond surfacing the backend `{ code, message }` via existing generic toasts.
- Conversation-builder modals, group/ungroup actions, visual grouping of turns, broken-row rendering,
  runs-compare turn columns, client-side count recomputation.

## 3. Contract facts the wiring rests on

- Test-case DTOs gain two top-level fields: `conversationId` (UUID string | null),
  `turnIndex` (int | null). **Both-or-neither** on write (sending exactly one → HTTP 400). Omitted on
  responses when null.
- Not settable via bulk PATCH (whitelist stays `{ testCaseName, data }`).
- Suite DTOs **drop** `multiTurn` (no replacement flag).
- `numberOfTestCases` is the runnable-**conversation** count; read as-is, no client recomputation.
- New write-time errors: 400 `VALIDATION_ERROR` (grouping-field rules), 409
  `UNIQUE_CONSTRAINT_VIOLATION` (duplicate `(conversationId, turnIndex)`). Run-creation errors:
  409 `INVALID_OPERATION` (MCP suite + conversation rows; zero runnable conversations). All surfaced
  as-is.
- Under the row-based model each turn is its own `testCaseId`, so results grouping-by-`testCaseId`
  (e.g. `mergeByTestCaseId` in compare mode) stays 1:1-correct and needs **no change** this iteration.

## 4. Design

### 4.1 Models — add the two top-level fields

- `src/models/evaluation/dataset.ts` → `DatasetTestCase`: add
  `conversationId?: string | null;` and `turnIndex?: number | null;`.
- `src/models/evaluation/test-suite.ts` → `TestCase`: add the same two optional fields.

Both are siblings of `data`, never nested inside it.

### 4.2 Round-trip wiring (correctness-critical)

- **`rowToTestCase`** (`src/components/TestSuites/utils/data.ts`): carry the two fields, guarded
  **both-or-neither** — include both only when `conversationId` is a non-empty string **and**
  `turnIndex` is a finite number; otherwise omit both keys entirely. This prevents an accidental
  "exactly one" payload (→ 400) when a row has a stray partial value.
- **`getTestCaseGridData`** (same file): already spreads the whole test case, so the two fields land on
  the grid row automatically. No code change; add a passthrough unit test to lock the behavior.
- **`onCellChange`** (`src/components/TestSuites/TestCases/TestCasesList.tsx`): today it merges every
  field except `testCaseName`/`enabled` into `data`. Add `conversationId` and `turnIndex` to that
  exclusion set so they are written to the **top-level** row object, not into `data`.

### 4.3 Authoring UI — two editable columns

- In `getTestCaseColumns` (`src/components/TestSuites/utils/columns.tsx`) add two columns near the
  identity columns:
  - `turnIndex` — number editor (`EditableCellRenderer` with `inputType: 'number'`, integer step),
    `valueGetter` reads top-level `params.data?.turnIndex`.
  - `conversationId` — text editor (`EditableCellRenderer`), `valueGetter` reads top-level
    `params.data?.conversationId`.
  - Both wire their `onChange` through the component's `onCellChange` (which now keeps them top-level),
    and both respect `isReadOnly`.
- User enters the UUID and turn ordering manually; backend 400/409 catch mistakes (both-or-neither,
  bad UUID, negative/over-cap index, duplicate turn). No client-side contiguity/UUID validation this
  iteration.

### 4.4 CRUD API

- `createTestCase`:
  - `src/server/eval/datasets-api.ts` and `src/server/eval/test-suites-api.ts`: widen the body type
    from `Pick<..., 'testCaseName' | 'data'>` to also allow `conversationId` and `turnIndex`.
  - Server action wrappers in `src/app/[lang]/datasets/actions.ts` (and the test-suites actions if it
    exposes create): thread the wider body type.
- `updateTestCases` (PUT batch): **no signature change** — it already sends full `DatasetTestCase[]`,
  so the fields flow once the type + `rowToTestCase` are updated.
- Bulk PATCH: unchanged — do **not** send grouping fields there.

### 4.5 CSV import / export

- Export (`export.csv`) and import (multipart) are parsed by the backend; reserved columns
  (`conversationId`, `turnIndex`) are handled server-side. No frontend request change.
- Import **preview**: `getGridDataFromImportPreview` renders `detectedColumns` returned by the backend
  as-is, so reserved columns simply display. Change: extend the `RowMapping` type
  (`src/components/TestSuites/TestCases/Import/models.ts`) with optional `conversationId` /
  `turnIndex`. **Verify** the preview shows them and does not fold them into `data`. Expect no
  functional change beyond the type.

### 4.6 Rollback — suite-level `multiTurn` only

- `src/models/evaluation/test-suite.ts`: remove `multiTurn?: boolean;` from `TestSuite`.
- `src/components/TestSuites/TestCases/TestCases.tsx`: remove `isMultiTurn`, `onToggleMultiTurn`, the
  `DialCheckbox` + description block, and the now-unused `isDeployment`, `SuiteType`, and
  `DialCheckbox` imports.
- `src/constants/i18n.ts`: remove `MultiTurn` / `MultiTurnDescription` from `TestSuitesI18nKey`.
- `src/locales/en.ts`: remove the `MultiTurn` / `MultiTurnDescription` strings.
- **Keep:** metrics `Condition` / `ConditionHint` + `isLastTurn()` regex; the run-results grid Turn /
  Total-turns columns and default sort; `ResultDto.turnIndex` / `totalTurns`.

### 4.7 Counts & errors — no new code

- `numberOfTestCases` continues to be read as-is (runnable-conversation count).
- New 400/409 failures surface through the existing generic error toasts already wired on test-case
  save (PUT batch) and run creation. No code-to-message mapping layer added.

## 5. Testing

- **Unit** (`TestSuites/utils/tests/data.spec.ts` or equivalent):
  - `rowToTestCase`: both fields present → both included; exactly one present → both omitted; none →
    both omitted; `turnIndex: 0` counts as present (falsy-but-valid).
  - `getTestCaseGridData`: `conversationId`/`turnIndex` on the source test case appear on the grid row.
- **Unit** (columns): `getTestCaseColumns` includes `conversationId` + `turnIndex` columns; editable
  when not read-only; their `valueGetter` reads top-level; `onChange` routes through `onCellChange`.
- **Component** (`TestCasesList` / `onCellChange`): editing `conversationId`/`turnIndex` writes
  top-level, never into `data`.
- **Rollback**: `TestSuite` type no longer has `multiTurn`; `TestCases.tsx` renders without the toggle;
  no test references `MultiTurn`/`MultiTurnDescription`.
- **CSV**: import-preview test confirming reserved columns render and stay out of `data` (if any code
  change is needed).

## 6. Risks / notes

- The both-or-neither guard lives in `rowToTestCase`; any other save path that bypasses it must apply
  the same rule (currently PUT batch is the only edit path; create goes through `createTestCase`).
- Manual UUID entry is deliberately minimal; a future iteration may add generate-UUID / auto-index and
  contiguity validation (out of scope here).
