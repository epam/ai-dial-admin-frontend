## Context

AG Grid here is community-only (`ag-grid-react` pulling in `ag-grid-community`; `AgGridWrapper.tsx`
registers `CustomFilterModule`/`ExternalFilterModule`, never a `SetFilterModule`), so the Enterprise
`agSetColumnFilter` isn't available. The one existing fixed-value-list filter in this codebase,
`SessionValueFilter` (Analytics enum columns), is built on `ag-grid-react`'s
`useGridFilter`/`CustomFilterProps` for exactly this reason, and is the template this change follows.

The `status` colDef lives once, in `RUNS_COLUMN` (`constants/grid-columns/grid-columns.tsx`), and is
reused unmodified by `SUITE_RUNS_COLUMN` (suite-scoped Runs tab) and `COMPARE_RUN_PICKER_COLUMN`
(compare-run picker modal) — so the colDef change is one edit. But AG Grid resolves a string `filter`
key through the `components` map on the specific grid *instance* rendering it, not globally, and the
three consuming components build their own `additionalGridOptions` independently:
- `components/ListView/Evaluation/List.tsx` renders the unscoped `/runs` list and the suite-scoped tab
  is a separate component (`components/TestSuites/Runs/Runs.tsx`) with its own `gridOptions` object.
  Both use the infinite row model with a server datasource; `getRequestFilters` turns
  `params.filterModel` into the `FilterDto[]` sent to the query endpoint.
- `components/Runs/Compare/SelectCompareRunModal.tsx` renders through the generic
  `components/Grid/GridView/RadioSelectGrid.tsx`, which takes an already-fetched `Run[]` as a prop and
  runs AG Grid's default **client-side** row model — there is no server round trip, so filtering here
  only happens if the grid filters the in-memory rows itself.

`SessionValueFilter`'s `doesFilterPass` always returns `true` because its rows are always server-
filtered (infinite row model) — the callback is required by the interface but never meaningfully
exercised. That shortcut does not carry over here, because one of the three consumers is client-side.

## Goals / Non-Goals

**Goals:**
- One filter component whose behavior is correct in both the server-driven (infinite) and client-side
  row models it's used in, without the three call sites needing different wiring beyond registering it.
- Reuse `getStatusLabel` for option labels, so the filter's wording never drifts from the status badge's.
- Keep the request-side change additive: existing filter types/columns are unaffected.

**Non-Goals:**
- A search box, loading state, or server-resolved option list — `SessionValueFilter` needs these
  because its values aren't known until the server answers; `RunStatus` is a fixed TS enum
  known at build time, so none of that machinery is needed here.
- Changing what the compare-run picker's `runs` prop contains, or how it's fetched.

## Decisions

**Model shape conforms to `GridFilter`, not a bespoke shape.** `SessionValueFilter`'s model
(`{ values: string[] }`) is read by Analytics' own translation function, not `getRequestFilters`.
The two infinite-row-model consumers here feed `params.filterModel` straight into
`getRequestFilters(gridFilter: Record<string, GridFilter>)`, which expects
`{ filter, filterType, type: GridFilterType, dateFrom? }`. Rather than add a second translation path,
the new component emits `{ filter: selected.join(','), filterType: 'in', type: GridFilterType.INCLUDES }`
— a real `GridFilter` — so it flows through unchanged. This requires adding `INCLUDES` to
`GridFilterType` (`types/grid-filter.ts`) and mapping it to the already-existing
`FilterOperatorDto.INCLUDES` (`'in'`) in `getFilter()` (`utils/request/get-request-filters.ts`).
`FilterOperatorDto.INCLUDES` is not new — `getEntityAuditFilters` already sends it as a comma-joined
string for the same "match any of these values" need, so the backend contract is proven, not assumed.

**`doesFilterPass` does real work.** Implemented as "does the row's `status` field appear in the
model's comma-split value list, or does no model mean no filtering" — the same predicate either way.
For the infinite row model this is redundant (the server already returned only matching rows) but
harmless. For `RadioSelectGrid`'s client-side model it's load-bearing: it's the only thing that
actually removes non-matching rows from the already-fetched `runs` array. One implementation, correct
in both row models, beats branching the component on which grid it happens to be mounted in.

**Floating filter stays an empty placeholder, generalized rather than duplicated.** The column
already uses `EmptyFloatingFilter` (`components/Grid/FloatingFilter/EmptyFloatingFilter.tsx`) for
exactly the stated reason — "a fixed status... the filter menu is the only sensible way in" — matching
`SessionValueFilter`'s pairing with `SessionValueFloatingFilter`. `EmptyFloatingFilter` is already
generic (no Analytics- or Runs-specific code), so the status colDef keeps using it rather than
introducing a near-identical new component.

**`RadioSelectGrid` gains a `components` passthrough prop.** It's a generic, reusable grid
(`// TODO: use for all cases`) that currently builds its own `additionalGridOptions` with no way for a
caller to add grid `components`. Adding an optional `components?: Record<string, ComponentType>` prop,
merged into its internal `additionalGridOptions`, keeps `RadioSelectGrid` domain-free while letting
`SelectCompareRunModal` supply the Run-specific filter map — the same shape
`components/ListView/Evaluation/List.tsx` and `components/TestSuites/Runs/Runs.tsx` pass directly to
`GridView`. A single exported components map constant (next to the new filter component) is imported
at all three call sites so the string key can't drift between the colDef and the registration.

**Labels and strings are reused, not duplicated.** `getStatusLabel(status, t)` already maps every
`RunStatus` to its i18n key and falls back to the raw value for one the UI doesn't recognize — the
popup's option labels call it directly rather than re-deriving labels. `BasicI18nKey.SelectAll`
already exists and covers the "select all" control; no new key needed for it.

## Risks / Trade-offs

- [Existing `grid-columns.spec.ts` assertions pin `status?.filter` to `undefined` and
  `floatingFilterComponent` to `EmptyFloatingFilter`] → These need updating as part of this change;
  `floatingFilterComponent` staying `EmptyFloatingFilter` means only the `filter` assertion's value
  changes, not its target.
- [A fixed `GridFilterType.INCLUDES` → `FilterOperatorDto.INCLUDES` mapping is now reachable from any
  future column, not just Status] → Intentional and low-risk: it's additive to the `getFilter` switch
  and mirrors an operator the backend already accepts.
- [Three independent call sites must each register the same components map] → Mitigated by exporting
  one constant map rather than three ad hoc literals, so a future consumer copies one import instead of
  re-deriving the keys.

## Migration Plan

No data migration. This is a UI-only, additive-on-the-request-side change; existing saved column/filter
state in `localStorage` for the Status column (an `equals`/`notEqual` text model) simply stops matching
the new model shape and is treated as "no filter," which is the correct fallback.
