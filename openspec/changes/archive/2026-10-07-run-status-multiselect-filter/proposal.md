## Why

The Runs grid's Status column is a fixed enum (`PENDING`, `COMPLETED`, `RUNNING`, `FAILED`,
`CANCELLING`, `CANCELLED`), but its filter today is AG Grid's default text filter narrowed to
`equals`/`not equal` — an operator still backed by a free-text input in the column menu, so narrowing
by status means typing the exact enum string. An operator who doesn't already know the raw value has
no way to discover or pick it. A checkbox list of the known values removes that guesswork and matches
how the one other fixed-value column in this app (Analytics' enum columns) already resolves the same
problem.

## What Changes

- Replace the Status column's filter with a custom multiselect popup listing every `RunStatus`
  value as checkboxes (labelled via the existing `getStatusLabel` helper, so the text matches the
  cell's own badge), with a "select all" checkbox and a Reset action. **BREAKING**: the column no
  longer accepts a free-text `equals`/`not equal` value through AG Grid's native filter menu — the
  checkbox list is the only way to filter Status.
- Selecting one or more statuses narrows the list to rows matching any of them (an OR across the
  selection), via the backend's existing multi-value match operator.
- Add a `PENDING` status — a run queued but not yet started, so neither in-progress nor settled by
  the existing categories — with its own label, a settled-style (non-spinner) presentation, inclusion
  in the Status filter's checkbox list, and membership in `INCOMPLETE_RUN_STATUSES` (no analytics
  value is expected for it yet, the same as a still-running or cancelled-before-finishing run).
- No other change to the column's header, sort control, width, or cell rendering.

## Capabilities

### Modified Capabilities

- `eval-runs-list`: "Status is sortable, and filtered from a filter button" currently only
  constrains the filter *row* (a button, not a free-text input) and leaves what the button opens
  unspecified. This change specifies that the button opens a multiselect checkbox popup over the
  fixed status values, SHALL NOT offer a free-text or operator-based entry anywhere (including AG
  Grid's native column-menu filter), and that selecting multiple values narrows by any of them.
- `run-status-display`: "Run status presentation" enumerates the statuses the system presents and how.
  Adds `PENDING` to that enumeration, presented as settled-style (no in-progress indicator) rather
  than transitional, since a queued run is not yet doing anything to show progress on.

## Impact

- `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` — `status` colDef in `RUNS_COLUMN`
  (reused by `SUITE_RUNS_COLUMN` and `COMPARE_RUN_PICKER_COLUMN`): drop `evalStringFilter(...)`,
  point `filter`/`floatingFilterComponent` at the new components.
- New custom filter component (modeled on
  `components/Analytics/SessionsTrace/List/SessionValueFilter.tsx`, but with a static options array
  instead of a server-resolved one) plus a paired empty floating-filter component.
- `apps/ai-dial-admin/src/types/grid-filter.ts` (`GridFilterType`) and
  `apps/ai-dial-admin/src/utils/request/get-request-filters.ts` (`getFilter`): add an `INCLUDES`
  value so the multiselect's model reaches the backend as `FilterOperatorDto.INCLUDES` (`'in'`),
  the same operator `getEntityAuditFilters` already sends as a comma-joined value.
- Three grid-rendering sites need the new filter component registered in their own
  `additionalGridOptions.components` (AG Grid resolves a string `filter` per grid instance, not
  globally): `components/ListView/Evaluation/List.tsx` (unscoped `/runs`), `components/TestSuites/Runs/Runs.tsx`
  (suite-scoped tab), and `components/Runs/Compare/SelectCompareRunModal.tsx` via
  `components/Grid/GridView/RadioSelectGrid.tsx` (compare-run picker — client-side row model, so this
  is the one place the filter's `doesFilterPass` must do real work rather than defer to a server
  query).
- `constants/grid-columns/tests/grid-columns.spec.ts` — the two existing assertions that
  `status?.filter` is `undefined` and `floatingFilterComponent` is `EmptyFloatingFilter` need updating
  to the new filter/component.
- `apps/ai-dial-admin/src/components/ListView/Evaluation/utils/runs-query.ts` — `buildFieldFilter`
  routed every operator, including the new `INCLUDES`, through the single-value `compare(...)`
  builder; a comma-joined value under `In` compared a row's `status` against the whole joined string
  as one literal, matching nothing. Fixed to call the DSL's existing array-shaped `inValues(...)`
  builder for `INCLUDES`.
- `apps/ai-dial-admin/src/models/evaluation/run.ts` (`RunStatus` enum), `constants/runs.ts`
  (`INCOMPLETE_RUN_STATUSES`, `ALL_RUN_STATUSES`), `constants/i18n.ts` / `locales/en.ts`
  (`RunsI18nKey.Pending`), and `components/Common/RunStatus/{utils.ts,RunStatus.tsx}`
  (`getStatusLabel`, `SETTLED_STATUS_DOT_CLASS`) — add the `PENDING` status end to end.
