## Context

Test cases are authored inline in an AG Grid on two surfaces that are already near-duplicates of each other:

- `src/components/TestSuites/TestCases/TestCasesList.tsx` (645 lines) — the suite-scoped view, with include-in-run filtering, an `enabled` toggle feeding `disabledTestCaseIds`, and a Try Out action.
- `src/components/Datasets/TestCases/TestCasesList.tsx` (357 lines) — the dataset-scoped view, without any of those.

Both hold `useState<Record<string, unknown>[]>` for rows plus a `dirtyRowsRef: Map<id, rowSnapshot>`, and both have byte-identical `updateData`, `onCellChange`, `getDirtyTestCases`, `clearDirtyAndRefresh`, the shift-select `onCellClicked`, the pinned-`newTestCases` effect, and the same `refreshGrid` dirty-merge. Their column builders (`TestSuites/utils/columns.tsx:146-231` and its near-copy in `Datasets/utils/columns.tsx`) contain the same ~140-line `cellRendererSelector` switch over `TestCaseItemType`.

Today's `onCellChange` works by mutating the row object in place:

```ts
data[field] = value;
if (field !== 'testCaseName' && data.data != null) {
  data.data = { ...data.data, [field]: value };
}
```

That is correct *only* because AG Grid currently hands back the very object that is in `rowData`. Grouping breaks this assumption — see the Decisions below. It is the single most important thing to get right.

The results grid (`src/components/Runs/View/`) renders one flat row per result, with `getAnalyticsColumns` producing `[...staticColumns, ...metricsColumns, INPUT BINDINGS, EXTRACTED]`. `executionColumns` already carries a `runIndex` column using a `+1` valueGetter — the exact pattern the turn column needs.

A proof-of-concept on `feat/17-multi-step-poc-alternative` implemented all of this. This design takes its row model and its UX wholesale, and departs from it on structure and on scope.

## Goals / Non-Goals

**Goals**

- One logical test case = one collapsible unit in the grid, regardless of turn count; single-turn cases look and behave exactly as they do today.
- One implementation of turn management serving both authoring surfaces.
- Pay down the pre-existing duplication rather than double it — the change should *reduce* net duplicated lines.
- Results display changes confined to a single file, so comparison/heatmap work does not conflict.
- Shared (case-level) fields stated once, per-turn fields stated per turn, with the split invisible to the existing schema value-getters.

**Non-Goals**

- Grouping, expansion, or row-count changes in the results grid.
- Run-summary turn-aware wording, conditional metrics, grouped CSV preview, drag-and-drop reordering.
- Client-side turn validation (contiguity, caps) — backend-owned.
- Verifying the backend wire contract before building. Explicitly accepted risk; see Risks.

## Decisions

### Array model, not row model

A multi-turn case is **one** `TestCase` whose `multiTurnData` is an ordered array of per-turn maps. The rejected alternative — each turn as its own test case sharing a `conversationId` and a `turnIndex` field — was the approach of an earlier reference branch (`origin/feature/multi-turn-support-2`). The array model keeps one case = one entity, so name uniqueness, delete, enable/disable, and bulk operations need no new concept of "which rows belong together" at the API level.

Turn order is **array position**. There is no persisted turn-index field to keep in sync.

### `data` and `multiTurnData` coexist

Shared (case-level) fields live in `data`; per-turn fields live in each `multiTurnData[i]`. `TestCaseSchema.perTurn` decides which is which; absent on pre-existing schemas, which therefore read as shared.

This reverses the POC design doc's original "mutually exclusive, both → 400" contract. The POC itself reversed it in its final commit, and that final state is what we adopt. Recording the reversal here because the earlier contract is still written down in that branch's docs and will otherwise look like the authority.

Accepted cost: this decision is the single largest complexity multiplier in the change. It is what forces `selectSharedFields`/`selectPerTurnFields`, `BlankCellRenderer`, the fan-out write on shared-field edits, the merge-on-load / split-on-save round trip, and the schema-editor Scope column. Dropping it would remove roughly 40% of the added surface. It is in scope by explicit decision, not by default.

### `_turnIndex` is client-only and never persisted

A grid row is a turn iff it carries `_turnIndex`. Set from array position at load; stripped at save. A single-turn case's row has no `_turnIndex` at all, which is what makes "is this case multi-turn?" a property of the rows rather than a flag anyone has to maintain.

Consequence: promote/demote are trivial. `promoteToMultiTurn` sets `_turnIndex: 0`; `demoteToSingle` deletes the key. There is no explicit multi-turn toggle in the UI and no state to get out of sync.

`renumberTurns` after every structural mutation keeps indices contiguous `0..n-1`, so the save-side sort is total and array position is unambiguous.

### Rows are merged on load, split on save

On load each turn row carries `{...shared, ...turn}` as its `data`. This matters: every existing schema column's `valueGetter` is `params.data?.data?.[field] ?? params.data?.[field] ?? ''`, and merging means those getters keep working with no change. Execution resolves fields per turn the same way, so the merged row is also the honest preview of what will actually run.

On save `collapseRowsToTestCases` groups by `id`, sorts by `_turnIndex`, and splits the merged map back apart via the schema's `perTurn` flags. Shared values are read off turn 0 — they are invariant across turns by construction, because a shared-field edit fans out to every turn row.

### The store is a ref, and `onCellChange` must not edit the row AG Grid hands it

This is the subtle one. Once rows are projected, the object a cell renderer receives is a **spread copy** produced by `toTurnRow`/`toSingleRow`/`toGroupRow` — not the underlying flat row. Mutating it in place, the way the current code legitimately does, would lose the edit the next time the projection re-derives (on any expand/collapse) and `getDirtyTestCases` would never see it.

So `onCellChange` locates the real row(s) in an authoritative flat store and edits those:

- **shared field** → write to *every* row of that case (fan-out), because the value is case-level;
- **per-turn or structural field** → write to the one row matching `id` + `_turnIndex`.

The store is `flatRowsRef` — every turn of every case, regardless of expand/collapse — paired with a `rawRowsVersion` counter that forces re-derivation. A ref rather than `useState` because the imperative readers (`getDirtyRows`, `getCaseRows`, called from a parent through `testCasesActionsRef`) must see the latest rows with no stale-closure risk.

This is the POC's design and it is load-bearing, but it is also the part most likely to read as over-engineering later. The comment at the declaration should say *why* — the projection cannot be the source of truth for a collapsed group's turns or for an off-screen edit — not merely *what*.

Dirty tracking changes shape accordingly: `dirtyIdsRef: Set<caseId>` replaces `dirtyRowsRef: Map<id, rowSnapshot>`. A snapshot of one row cannot represent a case whose other turns also changed.

### One shared editable hook

`useTurnGroupGrid` wraps the read-only `useTurnGroupProjection` and adds the store, dirty tracking, and turn CRUD.

The POC's two list files were compared function by function. These are **byte-identical** between them and absorb with zero variation: `flatRowsRef`/`rawRowsVersion`/`bumpRawRows`/`rawRows`, `dirtyIdsRef`, `refreshVersionRef`, `getCaseRows`, `replaceCaseRows`, `onAddTurn`, `onDeleteTurn`, `moveTurn`/`onMoveTurnUp`/`onMoveTurnDown`, `turnActionHandlers`, the `useTurnGroupProjection` call, the `getRowId`/`getRowHeight`/`onFilterChanged` grid-options triplet, the `refreshGrid` dirty-splice reducer, and the schema-prune loop.

Exactly two things differ, both parameterized:

| Variation | Parameter |
|---|---|
| whether `'enabled'` counts as structural (non-`data`) — TestSuites only | `structuralFields: string[]`, default `['testCaseName', '_turnIndex']` |
| which collapse function runs | `collapseRows: (rows, perTurnFields) => T[]` |

Stays in each caller: `onCellValueChanged`/`enabled` → `disabledTestCaseIds`, included-in-run filtering and sort, the fetch and its entity-specific grid-data mapper, `onDeleteCase`, `columnDefs` assembly, and all CRUD/import/export/publish/attach logic.

Alternative considered: leave the logic duplicated as the POC did. Rejected — the two files are already duplicates, and adding ~250 more identical lines to each guarantees they drift.

### Column factory lives under `Grid/`, not `TestSuites/utils/`

The POC put the shared column factory in `TestSuites/utils/grouped-columns.tsx` and had Datasets import across the feature boundary. Placing it at `components/Grid/columns/turn-columns.tsx` instead puts it beside the renderers it selects and avoids a Datasets → TestSuites dependency. `Grid/CellRenderers/` already hosts domain-aware components (`FileSelectCellRenderer` takes an `ApplicationRoute`), so this is consistent with where the line already sits.

### Results grid: two columns, nothing else

`turnIndex` and `totalTurns` are appended to `executionColumns` in `Runs/View/utils.ts`, immediately after `runIndex`, whose `+1` valueGetter they mirror. Headers stay hardcoded English to match the neighbouring `'# Run number'` and `'HTTP'`.

`ExtractionResult.tsx` is not touched. No projection, no expander, no `getRowId`, no `postSortRows`, no default multi-sort.

The POC did group results, and paid for it: because ag-grid community cannot keep synthesized child rows under a parent through a sort, it had to set `sortable: false, sort: null, sortIndex: null` on **every** column in grouped mode. A multi-turn run therefore lost column sorting entirely. That trade is not worth making here, and it lands squarely in the files comparison and heatmap work is changing. Per-turn scores need no special handling regardless: each turn is already its own result row, so metric columns just work.

### Dropped from the POC

| Dropped | Reason |
|---|---|
| `regroupSortedRows` (~40 lines + tests) | Exported and unit-tested; wired into no grid. Dead. |
| `_groupKey` override in `readGroupKey` | Existed solely so the results grid could group while keeping `id` as the real entity id. No results grouping → group key is always the case `id`. |
| `defaultExpanded` / `singlesFirst` projection params | Results-grid-only. Authoring is always collapsed-by-default. |
| `StackedTurnsCellRenderer`'s `getTurnValue` param | Results-grid-only escape hatch for reusing a column's own `valueGetter`. |
| `ValidationWarning.turnIndex` | Added to the model, rendered nowhere. |
| Run-summary turn relabeling | An extra `max(total_turns)` query for 11 reworded strings. |

`rowToTestCase` / `rowToDatasetTestCase` are **kept** alongside the new `collapseRowsTo*`. They still have a caller — `onDeleteCase` needs a single row → DTO — and forcing that through the collapse path buys nothing.

## Risks / Trade-offs

**The backend contract is unverified.** Nothing in this repo documents `multiTurnData`, `perTurn`, `turnIndex`, or `totalTurns`; shapes come from the POC's design doc, on the user's explicit decision to proceed on those assumptions. The POC *itself* reversed one of its central contract decisions mid-branch, which is the concrete precedent for this risk. Mitigation: the assumption is isolated to the model files and the two `data.ts` converters — the grid, hook, and renderers are contract-agnostic. If the wire format differs, rework is confined there.

**Shared/per-turn scoping is a real complexity multiplier**, accepted deliberately (see Decisions). If it proves confusing in use, the removal path is clean: make every field per-turn and the split functions become identities.

**`getRowHeight` and `StackedTurnsCellRenderer` are coupled by construction.** The renderer emits `STACKED_LINE_HEIGHT`-tall lines inside `STACKED_ROW_PADDING`; the row-height calculation must use the same constants or the last turn clips. Mitigation: both read the same exported constants from `Grid/constants.ts`, and the coupling is commented at both ends.

**Grid options are routed through `additionalGridOptions`.** `AgGridWrapper` forwards `getRowId` only when `isLiveData` is set and does not expose `getRowHeight`/`onFilterChanged` as props at all. `additionalGridOptions` is spread onto `AgGridReact` regardless. Precedent: `HeatMapTab`, `ContainerCreate`. Not ideal, but it is the existing escape hatch rather than a new one.

**Deleting a case that is mid-edit.** `replaceCaseRows` keys off case `id` and reinserts at the original position; `refreshGrid`'s dirty-splice reinjects the authoritative rows for a dirty case in place of whatever the server returned, guarded so a case is injected once. Both paths need tests.

**`newTestCases` may be vestigial.** Both list files hold this state, but nothing appears to add to it — `onAddTestCase` creates server-side and calls `refreshGrid()`. Verify during implementation. If dead, leave it in the callers rather than growing the hook's surface for it; do not remove it as part of this change.

## Migration Plan

Additive and backward-compatible. A `TestCase` without `multiTurnData` renders exactly as today — `getTestCaseGridData` takes the existing branch, produces one row with no `_turnIndex`, and the projection emits a `SINGLE` row with no chevron and no badge. A schema field without `perTurn` reads as shared, which for a single-turn case is indistinguishable from today's behaviour.

A results row without `turnIndex`/`totalTurns` renders two empty cells; nothing else about the results grid changes.

No data migration, no feature flag, no backfill.

## Open Questions

- Should a shared-field edit made on a collapsed GROUP row show any affordance that it is writing to all turns? Currently it is silent. Deferred until the behaviour has been used.
- Is there a sensible maximum turn count the UI should hint at before the backend rejects it? Unknown without the contract.
