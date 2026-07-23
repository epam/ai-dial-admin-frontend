# Multi-turn (array-model) + conditional metrics — frontend design

**Date:** 2026-07-23
**Branch:** `feat/17-multi-step-poc-alternative` (base: `development`)
**Status:** approved for implementation planning
**Reference (UX only):** `feature/multi-turn-support-2` — its grouped-grid, conditional-metric, and
run-results turn UX are the visual source of truth. Its **data model differs** (row-based: each turn a
separate test case sharing `conversationId`/`turnIndex`). This design keeps that UX but targets the
**array model** below. The HTTP API handoff is the source of truth for the contract.

## 1. Context

The backend adds **multi-turn test cases** and **conditional metric execution**. No new endpoints, no
new paths, no HTTP-method changes — every change is an additive field on an existing DTO, plus one
run-creation guard and one write-time validation.

**Multi-turn model (array-based).** A test case is single-turn OR multi-turn, decided entirely by data:

- Single-turn: flat `data` map (unchanged), keyed by the dataset `testCaseSchema`.
- Multi-turn: `multiTurnData`, an ordered array of per-turn data maps (each the same shape as `data`).
- The two fields are **mutually exclusive**. Turns are contiguous `0..N-1` by array order.
- There is **no** client-supplied conversation id, **no** per-row turn index, **no** suite flag, **no**
  separate multi-turn entity. Multi-turn is emergent from `multiTurnData` being present.

**Execution & results.** A multi-turn case runs a sequential chat-completions loop and persists **one
result row per turn**. All turns of one conversation share `testCaseId`, `runIndex`, and trace id, and
differ by `turnIndex`. Single-turn rows report `turnIndex=0`, `totalTurns=1`. Fail-fast: the first
failing turn yields one ERROR row; later turns are not sent.

**Conditional metrics.** A Test Suite Metric Definition (TSMD) may carry an optional JSONata
`condition`, evaluated per result row (per turn) over `{data, response, turn}`, deciding whether the
metric runs on that turn. Clean `true` runs it; clean `false` omits it from that row's values;
non-boolean/null/throwing surfaces as a metric-level error without failing the row.

## 2. Scope

All five handoff areas, both authoring surfaces (`TestSuites/` and `Datasets/`):

1. Multi-turn test-case authoring — grouped-grid UX over the array model (load/expand, save/collapse,
   add/remove/reorder turns, both-or-neither guard).
2. Conditional metrics — `condition` on TSMD (lifted from the reference branch).
3. Run results — `Turn` / `Total turns` columns, default sort, collapsible conversation grouping,
   conditional-metric skip/error surfacing.
4. CSV import/export — reserved `turnIndex` column, multi-row multi-turn representation
   (backend-driven; frontend plumbing + preview + warnings).
5. Run-creation MCP guard — surface `409 INVALID_OPERATION` for MCP suite over a multi-turn dataset.

**Out of scope:** proactive client-side disable of run creation for MCP+multi-turn (rely on the 409
toast); client-side JSONata validation beyond the reserved-system-function guard; client-side turn-cap
/ contiguity validation (backend owns it); analytics batch-write turn fields (frontend does export, not
batch-write); condition builder / autocomplete.

## 3. Contract facts the wiring rests on

- **Test-case DTOs** gain optional `multiTurnData` (array of `Map<String,Object>`). Present only for
  multi-turn; omitted from JSON for single-turn. Mutually exclusive with a non-empty `data`; when
  present must be non-empty.
- **Write validation (server):** both `data` (non-empty) + `multiTurnData` → `400 VALIDATION_ERROR`;
  `multiTurnData` empty array → `400 VALIDATION_ERROR`; per-turn schema validation is a soft outcome
  (`valid=false` + warnings, still persisted); exceeding max-turns cap (default 10) is soft-invalid,
  not a 400.
- **PATCH semantics (server):** sending `data` switches to single-turn (clears `multiTurnData`);
  sending non-null `multiTurnData` switches to multi-turn (clears `data`); `multiTurnData: null` clears
  the multi-turn payload. The frontend's **bulk PATCH whitelist stays `{ testCaseName, data }`** — all
  multi-turn switching flows through the PUT-batch full-DTO path, so PATCH semantics are not exercised
  by the frontend edit path.
- **`ValidationWarning`** gains `turnIndex` (int, nullable; null for single-turn). The over-cap warning
  uses field `$.multiTurnData`, code `ADDITIONAL` (pre-existing).
- **TSMD** gains `condition` (string, nullable, max 2000, JSONata). Null/blank ⇒ always runs. Invalid
  syntax / over-length ⇒ `400 VALIDATION_ERROR` on create and update. `condition` is present in the
  response only when set. Condition dictionary: `data`, `response`, `turn.index`, `turn.total`,
  `turn.last` (single-turn row = `{index:0, total:1, last:true}`).
- **Result / eval-summary DTOs** gain `turnIndex` (0-based; 0 for single-turn) and `totalTurns` (1 for
  single-turn). Turns of one conversation share `testCaseId` + `runIndex` (and trace id); order by
  `turnIndex` ascending. Conditional-metric error: metric absent from values, plus a metric-level error
  in the row's metric-info map as `{"error": "<message>"}` under the metric name (CSV column
  `metricError::<name>`). Clean-false skip = simply absent. Row stays SUCCESS.
- **Run creation:** MCP (`MCP_TOOL`) suite over a dataset containing ≥1 multi-turn case →
  `409 INVALID_OPERATION` ("Cannot create a run: MCP suites do not support multi-turn test cases").
  Existing run-creation guards unchanged.
- **CSV:** reserved `turnIndex` column immediately after `testCaseName`. Single-turn = one row, blank
  `turnIndex`. Multi-turn = one row per turn, shared `testCaseName`, `turnIndex` `0..N-1`. Import
  assembles a contiguous same-name run with explicit `turnIndex` into one `multiTurnData` case (sorted).
  Non-contiguous reappearance / duplicate `turnIndex` → import conflict warning.

## 4. Design

### 4.1 Models

- `src/models/evaluation/dataset.ts` → `DatasetTestCase`: add `multiTurnData?: Record<string, unknown>[]`.
- `src/models/evaluation/test-suite.ts` → `TestCase`: add the same field. `ValidationWarning`
  (wherever defined for these DTOs): add `turnIndex?: number | null`.
- `src/models/evaluation/metric.ts` → `Metric`: add `condition?: string` (sibling of bindings).
- `src/models/evaluation/run.ts` → `ResultDto`: add `turnIndex?: number`, `totalTurns?: number`.

`data` and `multiTurnData` are siblings; both never nested inside each other.

### 4.2 Authoring — grouped grid over the array model

The reference branch's grouped-grid UX is reused; the persistence adapter is new because the array
model stores turns inside one DTO rather than as separate rows.

**Grouping key = test case `id`; one client-only ordering field.** Turns of one multi-turn case all
expand from a single DTO, so they share that DTO's `id` — grouping keys on the existing `id`, no
separate group id is introduced (every case, saved or new, already has an `id` from
`createNewTestCaseRow`). The one field that must be added is `_turnIndex` (number) — array position is
not otherwise a per-row property, and it must survive re-sorts to rebuild `multiTurnData` in order. It
is **never** persisted and **never** placed in `data`. Because multiple grid rows now share one `id`
value, the grid sets `getRowId = \`${id}::${\_turnIndex}\`` so each turn row is a distinct AG-Grid node.

**Load / expand** (`getTestCaseGridData` in `TestSuites/utils/data.ts`;
`getDatasetTestCaseGridData` in `Datasets/utils/data.ts`):

- A case with `data` (no `multiTurnData`) → one SINGLE grid row, exactly as today.
- A case with `multiTurnData` → one TURN row per array element, each carrying the case's `id` and
  `_turnIndex = arrayIndex`, plus the turn's data flattened for the grid (same flatten pattern as
  today). The grouping util synthesizes the GROUP summary row from the shared `id`.
- Reuse the reference primitive: `src/utils/evaluation/test-case-grouping.ts` +
  `src/models/evaluation/test-case-grouping.ts` + `Grid/hooks/use-turn-group-projection.tsx` + the
  grouped cell renderers (`TestCaseNameCellRenderer`, `StackedTurnsCellRenderer`,
  `TurnExpanderCellRenderer`) + `TestSuites/utils/grouped-columns.tsx`. Adapt the readers so the group
  key comes from `id` and the turn order from `_turnIndex`, instead of persisted
  `multiTurnId`/`turnIndex`.

**Save / collapse** (`rowToTestCase` / `rowToDatasetTestCase` + `getDirtyTestCases`):

- SINGLE rows → `{ testCaseName, data }` (as today) — `multiTurnData` omitted.
- TURN rows sharing an `id` → collapse into ONE DTO: sort by `_turnIndex`, build
  `multiTurnData = [turn0Data, turn1Data, …]`, set `{ testCaseName, multiTurnData }` — `data` omitted.
- **Both-or-neither guard:** a saved DTO carries exactly one of `data` / `multiTurnData`, never both,
  never neither, never an empty `multiTurnData`. Strip the ephemeral `_turnIndex` before send.
- Dirty-tracking keys on `id` (as today), so editing any turn marks the whole case dirty; at save all
  grid rows with that `id` are gathered and collapsed together.

**Identity on the GROUP row (diverges from the reference).** A multi-turn case is one entity with one
name/enabled/validity. Turn sub-rows edit turn **data only**; `testCaseName`, `enabled`, and the
validity status render/edit on the GROUP row. `TestCaseNameCellRenderer` shows the case name + a
`{count} turns` badge on the GROUP row and an indented `Turn k` label on TURN rows.

**`onCellChange`** (`TestSuites/TestCases/TestCasesList.tsx`, `Datasets/TestCases/TestCasesList.tsx`):
add `_turnIndex` to the field-exclusion set (never merged into `data`, like `testCaseName`/`enabled`;
`id` is already excluded). Editing a data field on a TURN row writes that turn row's `data`; on save the
turn rows collapse into the array in `_turnIndex` order.

**Mutation affordances** (reuse reference helpers `promoteToMultiTurn`, `demoteToSingle`,
`reorderTurns`, `renumberTurns` from `test-case-grouping.ts`):

- Row action **Add turn** on a SINGLE case → promote to multi-turn (existing `data` becomes turn 0,
  append an empty turn 1); the case keeps its `id`, both turn rows share it.
- **+ add turn** within a GROUP → append an empty TURN row, `_turnIndex = N`.
- **Remove turn** → drop the TURN row, renumber `_turnIndex` contiguously. When exactly one turn
  remains, **auto-demote to single-turn**: convert the surviving turn's data back to `data`, drop the
  group — avoids a degenerate 1-element `multiTurnData`.
- **Reorder** (up/down) → swap `_turnIndex`, renumber.

**Schema.** Each turn's data map reuses the dataset's single `testCaseSchema` — no schema change. Turn
rows render the existing data columns; the GROUP row stacks per-turn values via
`StackedTurnsCellRenderer`.

### 4.3 CRUD API

- Widen `createTestCase` body from `Pick<…, 'testCaseName' | 'data'>` to additionally allow
  `multiTurnData`, in `src/server/eval/datasets-api.ts`, `src/server/eval/test-suites-api.ts`, and the
  `app/[lang]/datasets/actions.ts` (and test-suites actions if it exposes create) wrappers.
- `updateTestCases` (PUT batch): no signature change — sends full DTO array; `multiTurnData` flows once
  `rowTo*` populates it.
- Bulk PATCH: unchanged (`{ testCaseName, data }`).

### 4.4 Conditional metrics (lift from reference branch ~verbatim)

- `src/components/TestSuites/Metrics/AddMetric/constants.ts`: `CONDITION_MAX_LENGTH = 2000`;
  `SYSTEM_FUNCTION_CONDITION_REGEX = /^[A-Za-z_][A-Za-z0-9_]*\(\)$/`.
- `.../AddMetric/utils.ts`: `isReservedSystemFunctionCondition(condition?)` — true when the trimmed
  condition matches the reserved-call regex.
- `.../AddMetric/Configuration.tsx`: `condition` / `conditionError` / `onChangeCondition` props; a
  `Condition` `DialInput` (label, hint caption, placeholder `$exists(response.answer)`,
  `maxLength=CONDITION_MAX_LENGTH`, error/invalid wiring); include `condition` in the JSON-view
  `MetricConfigurationData`.
- `.../AddMetric/AddMetricModal.tsx`: `condition` state; hydrate from `editingMetric.condition` (its own
  effect — condition is on the plain list item, not the aggregated schema fetch); compute
  `conditionError` via the guard; gate step-2 validity on `!conditionError`; thread props to
  `Configuration`; add `condition: condition.trim() || undefined` to the `onConfirm` payload.
- `src/components/TestSuites/Metrics/Metrics.tsx`: render `metric.condition?.trim()` or the
  `ConditionAlwaysRun` fallback in the metric card.
- i18n: `TestSuitesI18nKey.{ Condition, ConditionHint, ConditionAlwaysRun,
ConditionSystemFunctionUnavailable }` in `constants/i18n.ts` + strings in `locales/en.ts` (hint copy
  documents `data.<column>`, `response.<column>`, `turn.index/total/last`, "Leave blank to always run").
- CRUD/GET carry `condition` automatically (create/update send the full `Metric`; GET returns it). PUT
  is full replacement — blank ⇒ `undefined` ⇒ clears (reverts to always-run).

### 4.5 Run results — turn display

- **Columns** (`src/components/Runs/View/utils.ts`): add `Turn` (`valueGetter` = `turnIndex + 1`,
  1-based, blank when absent) and `Total turns` (raw `totalTurns`) to the execution column group.
  Default multi-sort `testCaseName → runIndex → turnIndex` (all `asc`) so a conversation's turns load
  contiguous and in order.
- **Grouping** (reuse the reference collapsible-conversation path:
  `Runs/View/results-grouping-columns.tsx`, `use-turn-group-projection.tsx`, the read-only renderers):
  **group key = `${testCaseId}::${runIndex}`** (optionally trace id), NOT `multiTurnId` (the array
  model has no such field). `totalTurns > 1` ⇒ multi-turn group; single-turn rows float to the top
  (`singlesFirst`), groups default-expanded. Column sort disabled in grouped mode (ag-grid community
  limitation) — as in the reference.
- **Conditional-metric surfacing:** a clean-false skip ⇒ metric absent ⇒ blank cell (no special code).
  A condition error ⇒ metric absent from values + `metricInfos[name].error` ⇒ existing
  `metricError::<name>` rendering. `development` already handles `metricInfos` / `metricError`
  (`run.ts`, `Runs/Details/RunMetricDetailPanel`, `Runs/View/utils`, `Runs/Export/utils/group-columns`)
  — no new results-side code for the conditional feature.

### 4.6 CSV import / export

- **Export:** backend emits the reserved `turnIndex` column (after `testCaseName`) and one row per turn;
  frontend export just triggers the download — no request change.
- **Import preview:** extend `RowMapping` (`src/components/TestSuites/TestCases/Import/models.ts`,
  shared by the Datasets import modal) with optional `turnIndex`. Verify the preview renders the
  reserved column and keeps it out of `data`. Backend assembles contiguous same-name rows with explicit
  `turnIndex` into one `multiTurnData` case (sorted). No request change.
- **Import warnings:** non-contiguous reappearance and duplicate `turnIndex` come back as conflict
  warnings (column `testCaseName`) and surface through the existing preview warnings display — verify
  they render; no new mapping layer.

### 4.7 Run-creation MCP guard

- Surface `409 INVALID_OPERATION` ("Cannot create a run: MCP suites do not support multi-turn test
  cases") through the existing generic run-creation error toast. No proactive client-side disable this
  iteration. No code-to-message mapping layer.

### 4.8 Counts & errors — no new code

- `numberOfTestCases` (runnable count) read as-is; no client recomputation.
- All new 400 / 409 write-time failures surface through the existing generic error toasts already wired
  on test-case save (PUT batch), metric save, and run creation.

## 5. Testing

- **Models / round-trip** (`TestSuites/utils/tests/data.spec.ts`, `Datasets/utils/tests/data.spec.ts`):
  - `getTestCaseGridData`: a `multiTurnData` case expands to N TURN rows sharing the case `id` and
    carrying `_turnIndex`; a `data` case yields one SINGLE row.
  - `rowToTestCase` / `rowToDatasetTestCase`: TURN rows sharing an `id` collapse to one DTO with
    `multiTurnData` in `_turnIndex` order and no `data`; SINGLE row → `data`, no `multiTurnData`;
    `_turnIndex` stripped; never both, never empty `multiTurnData`.
- **Mutations** (`test-case-grouping` util tests): promote single→multi; append turn; remove turn with
  auto-demote at 1 remaining; reorder + renumber contiguous.
- **`onCellChange`** (`TestCasesList` component tests, both surfaces): editing a data field on a TURN
  row writes that turn's data; `_turnIndex` never merged into `data`.
- **Conditional metrics** (mirror reference): `isReservedSystemFunctionCondition` truth table;
  `Configuration` renders the Condition input, fires `onChangeCondition`, shows `conditionError`;
  `AddMetricModal` hydrates from `editingMetric`, blocks finish on reserved call, payload carries
  `condition` (and `undefined` when blank); `Metrics` renders condition value / "Always run".
- **Results** (`Runs/View/utils.spec`, grouping tests): `Turn` shows `turnIndex+1`; `Total turns` raw;
  default sort case→run→turn; grouping keys on `${testCaseId}::${runIndex}`; `totalTurns>1` groups,
  single-turn floats first.
- **CSV** (import-preview test): `turnIndex` column renders and stays out of `data`; conflict warnings
  render.

## 6. Risks / notes

- The both-or-neither collapse guard lives in `rowTo*` + `getDirtyTestCases`; any other save path that
  bypasses it must apply the same rule (currently PUT batch is the only edit path; create goes through
  `createTestCase`).
- The reference grouping util was written for a row-based model where `multiTurnId` / `turnIndex` are
  persisted. Here the group key is the existing test case `id` and only turn order (`_turnIndex`) is
  client-only; the readers must be adapted to those, and the mutation helpers must re-collapse on save.
  Because turn rows share one `id`, the grid needs `getRowId` = `` `${id}::${_turnIndex}` `` for
  distinct nodes.
- Results grouping keys on `${testCaseId}::${runIndex}` — verify this is stable when the same case runs
  multiple times (runIndex disambiguates) and that trace id (if used) agrees.
- MCP guard is toast-only; a future iteration may add a proactive disable once the run UI can cheaply
  know a dataset contains multi-turn cases.
