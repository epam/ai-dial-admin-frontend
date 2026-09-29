## Why

The runs list carries eight columns that answer almost none of the questions an operator opens it
with. It shows two id-ish columns (`ID`, `Test run name`) side by side, spells its counts out as
`Number of runs` / `Number of test cases`, hides `Test Suite ID` and `Created date` behind the
columns panel, spends a full text column on a status that reads as a dot, and says nothing about
what was evaluated (target, metrics), how long it took, what it cost, or how it scored. Every one of
those has to be answered by opening a run.

The same `RUNS_COLUMN` array (`apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx:1276`)
backs three surfaces — the `/runs` list (`ListView/Evaluation/List.tsx`), the Test Suite view's Runs
tab (`TestSuites/Runs/Runs.tsx`), and the compare-run picker
(`Runs/Compare/SelectCompareRunModal.tsx`) — so the column set is reworked once and the surfaces
opt into the variant they need. Sizing is the other half of the problem: `defaultColDef` in
`AgGridWrapper` gives every column `flex: 1` and `minWidth: 150`, so a status dot and a `Runs` count
each occupy 150px+ of an evenly-split row while the run name — the only column anyone scans by —
truncates.

Backend support for four of the five new columns is not in place yet (see Non-goals), so those
columns ship reading deterministic mock values through `valueGetter`, keeping the renderers,
sizing, truncation and tests production code.

## What Changes

- Rework the shared runs column set to 12 columns in this order: Status, Test case run name, Runs,
  Test cases, Test Suite ID, Target, Metrics, Start Date, End Date, Duration, Cost, Overall score.
- Combine `ID` + `Test run name` into one `Test case run name` column rendered as title (run name,
  `text-primary`, 14px) over subtitle (run id, `text-secondary`, 12px), each line truncating
  independently with the full value on hover.
- Resize Status to a dot-only column shown first; the status label moves into a tooltip. Requires a
  MODIFIED delta on `run-status-display`, whose current requirement mandates a label alongside the
  indicator.
- Rename `Number of runs` → `Runs` and `Number of test cases` → `Test cases`.
- Drop `Created date` entirely; keep Start Date and End Date visible.
- Add `Target` (evaluated Application / Model / MCP entity, name over type, same two-line
  treatment), `Metrics` (test suite metric names as tags with a measured `+N` overflow badge),
  `Duration` (derived from `startedAt`/`completedAt`), `Cost`, and `Overall score`.
- Size columns to their content: `Test case run name`, `Test Suite ID` and `Metrics` stay flexible
  (`flex: 1`); the rest are auto-sized to the wider of header and cell via AG Grid's
  `autoSizeStrategy: { type: 'fitCellContents' }`, never wrapping. This needs a new opt-in prop on
  `AgGridWrapper`, per-column `minWidth` overrides, and a fix so autosize-sourced `columnResized`
  events are not written to the persisted column state.
- Make a row click on the Test Suite Runs tab open the run details page in the same tab
  (ctrl/cmd/middle-click still opens a new tab), matching `/runs`, which already routes through
  `onCellClicked`.
- Version the `/runs` grid `storageKey` so the reworked set is not masked by column state saved
  against the old one.
- Give the compare-run picker its own explicit subset, so mock-backed columns do not leak into a
  selection modal.

## Non-goals

- **Converging the Test Suite Runs tab onto `EvaluationListView`.** `TestSuites/Runs/Runs.tsx` stays
  a separate consumer of the shared columns; its SSE stream, page-0 pre-fetch and action wiring are
  untouched. The two surfaces' drift is recorded as known debt in `design.md`. That tab still fetches
  through `GET /test-suite-runs` (`test-suites/actions.ts`), not the query API, so it does not carry
  `suiteSnapshot`/`metricNames`/the post-query display values — its Target, Metrics, Cost and Overall
  score cells read as the missing-value indication until it moves onto the query-backed action too.
- **Server-side sort and filter for Duration, Cost and Overall score.** Duration is derived
  client-side from two timestamps; Cost and Overall score are appended to a `test_suite_runs` row
  after the query itself runs (see `RUN_SELECT_FIELDS`'s doc comment) — none of the three is a
  queryable field, so all three stay `sortable: false`, `filter: false`. Runs, Test cases, Target and
  Metrics are all wired: the two counts and Metrics map to a real single field each
  (`number_of_runs` / `number_of_test_cases` / `metric_names`); Target's filter ORs
  `deployment_ref::name` and `mcp_deployment_ref::name` (the test suites' `application` column shape),
  and since a `SortItem` can't express that OR, its sort approximates by `deployment_ref::name` alone —
  MCP_TOOL rows, which carry no value there, sort together rather than interleaving by their own name.
- **Adding `useRunStatusStream` to `/runs`.** Noted as a risk in `design.md` (a dot-only status with
  no text goes stale more quietly), but out of scope.
- **Reworking `TagsCellRenderer`'s known defects** (hook order, duplicated ref assignment) beyond
  what the Metrics column needs.

## Capabilities

### New Capabilities

- `eval-runs-list`: what the runs list presents (column set, order, per-column cell view,
  truncation and overflow rules, content-based sizing, row activation) across the `/runs` list, the
  Test Suite Runs tab and the compare-run picker.

### Modified Capabilities

- `run-status-display`: status in a list row is an indicator alone, with the label reachable on
  hover/focus, instead of always an indicator plus a visible label.
- `grid-column-selection`: automatic sizing is not an operator choice and is not persisted; a view
  whose column set changes incompatibly starts from its new defaults.

## Impact

- `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` — `RUNS_COLUMN` reworked, suite
  and compare-picker variants added.
- `apps/ai-dial-admin/src/components/Grid/CellRenderers/` — new `TitleSubtitleCellRenderer` (Test
  case run name, Target) and Duration / Cost / Overall score renderers or formatters; `Metrics`
  reuses `TagsCellRenderer`.
- `apps/ai-dial-admin/src/components/Common/RunStatus/RunStatus.tsx` — label-less variant; the
  visible label stays on `Runs/Summary/Header.tsx`.
- `apps/ai-dial-admin/src/components/Grid/AgGridWrapper.tsx` — `autoSizeStrategy` opt-in;
  autosize-sourced resize events excluded from persistence.
- `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx` — versioned `storageKey`,
  autosize opt-in.
- `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx` — suite column variant, same-tab row
  activation, autosize opt-in.
- `apps/ai-dial-admin/src/components/Runs/Compare/SelectCompareRunModal.tsx` — picker column subset.
- `apps/ai-dial-admin/src/app/[lang]/runs/actions.ts`,
  `apps/ai-dial-admin/src/components/ListView/Evaluation/utils/runs-query.ts`,
  `apps/ai-dial-admin/src/models/evaluation/run.ts` — `/runs` reads Target, Metrics, Cost and Overall
  score from the query API (`test_suite_runs`) instead of `Runs/mocks/`, since deleted.
- No new locale keys: `RUNS_COLUMN` `headerName`s are hardcoded English today and stay that way
  (converting the array to a `t()` factory would touch all three consumers for no user-visible gain);
  the status tooltip keeps using the existing `getStatusLabel(status, t)`.
- Co-located unit / component tests.
