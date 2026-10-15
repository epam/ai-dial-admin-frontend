## Context

See proposal.md — Why. Single-run row detail has two positions, both opened through `useDetailMode` into the AppContext sidebar:

- **Bottom** — `ExecutionRowDetailBottomPanel`: loads one `AnalyticsResult`, builds `RowDetailSection[]` with `buildRowDetailSections(detail, null, …)`, applies the Display tree, renders `ExecutionRowDetailPivotTable`.
- **Right** — `RunMetricDetailPanel`: loads the same `AnalyticsResult` itself and renders the legacy card layout from different helpers (`getDetailEntries`, `getMetricGroups`).

The compare page already shows how to do both positions with one component: `CompareRowDetailPanel` takes a `position`, renders `CompareRowDetailPivotTable` at the bottom or `CompareRowDetailTable` on the right, and shares `RowDetailHeader` and the Display overlay. Its table is the design's target; it is built from the same `RowDetailSection[]` the single-run pivot already uses, so the data layer needs no change.

## Goals / Non-Goals

**Goals:**
- One single-run panel component for both positions; the right position renders the compare-style table with one Values column.
- Reuse the compare table's chrome and the shared row-detail helpers instead of copying them.
- Delete the legacy panel and everything only it used.

**Non-Goals:**
- Parametrising the compare components for a one-run mode (see D2).
- Moving compare row-detail files to a shared folder.
- Changing the compare page or the bottom pivot.

## Decisions

### D1. One panel component with a `position`, as the compare panel does

`ExecutionRowDetailBottomPanel` becomes `ExecutionRowDetailPanel` and gains `position: SidebarPosition`. Bottom renders `ExecutionRowDetailPivotTable` (unchanged); right renders the new `ExecutionRowDetailTable`. The fetch, section building, Display tree, `RowDetailHeader` and the Display overlay are already in the component and are shared by both. `onSwitchToSidebar` is renamed `onSwitchDisplayMode`, the prop `RowDetailHeader` already uses. `useDetailMode` renders this one component for both modes, passing `ROW_DETAIL_BOTTOM_CLASS` or `ROW_DETAIL_SIDEBAR_CLASS` (the class `CompareView` uses for the right position, replacing the fixed `w-[750px]`).

`displayTreeRef` in `useDetailMode` already persists the Display tree across close/reopen; because both positions now pass it as `initialDisplayTree`, the selection also survives a position switch. The rename keeps the hook's persistence contract: the panel still calls `onDisplayTreeChange` and receives `initialDisplayTree`.

The mode-switch handler drops its `fieldKey = null`: `switchToSidebar` already ignores focus, and `showDetailPanel` now forwards `fieldKey` and `focusRequestId` for the right position as well, so a cell click focuses its field in either mode.

Alternative considered: keep two components, one per position. Rejected: that is the status quo, it duplicates the fetch/sections/display code, and it is exactly the drift this change removes.

### D2. A dedicated single-run table; reuse the shared parts, not the compare table itself

Three ways to get the table:

1. **Parametrise `CompareRowDetailTable`/`DetailRow`/`SectionRows`/`FilterRow` for one run** — hide the Delta and action columns, the minimap, the delta filter, and the diff props when `runs.length === 1`. Rejected: those components are threaded with run slots, `hasComparedMatch`, diff kinds and open-diff callbacks. Making each conditional adds branches to a screen this change must not alter, and a regression there would hit the compare page.
2. **Extract a shared table core** into `Details/RowDetails`, with compare and single-run as thin wrappers. Cleanest end state, but it moves and rewrites five compare components and their specs for a visual alignment change. Rejected as out of proportion here; it can follow when a third caller appears.
3. **A new `ExecutionRowDetailTable` that composes the shared pieces (chosen).** It is a small component (sticky header, filter row, section rows, value rows) that imports, unchanged: `TextFilterCell` and the `RowDetailFieldFilter`/`RowDetailValueFilter` types and `ROW_DETAIL_*` size/class constants from the compare folder, `filterRowDetailSections`, `FieldValue`, `StatusValue`, `FullscreenValueViewer`, `scrollPivotToField`, `isRightAlignedRowDetailField`, `getScoreFieldValue`, `SECTION_I18N`. Only the grid template changes: two columns, `212px minmax(0, 1fr)`, with no delta, action or minimap tracks.

The single-run table reaches into `Runs/Compare/ExecutionResults/RowCompareDetails/` for `TextFilterCell`, the constants and the model types. `Details/RowDetails` already imports from `Runs/Compare` (the metric-delta utils), so the dependency direction is not new; the shared pieces stay where they are, and a later extraction (option 2) will find them in one place.

Row rendering is a local `ExecutionRowDetailRow`: label cell with the compare indent and `DialEllipsisTooltip`, value cell with the status badge / `FieldValue`. Score fields use the same `p-0` fill as the compare row so the bucket colour fills the cell, and numeric fields are right-aligned via `isRightAlignedRowDetailField`. The value cell is capped by `ROW_DETAIL_CELL_BASE`'s `max-h-[104px]`, as in compare. `FieldValue` already reports clipping through `onOverflowChange`, so the row reveals an `IconMaximize` button (`opacity-0 group-hover:opacity-100 focus-visible:opacity-100`, labelled with the existing `ViewFullValue`-style string, a real `<button>`) only when the value overflows; it opens `FullscreenValueViewer`, the popup the pivot opens. The button sits inside the value cell, not in an extra column — the design has none.

### D3. Filtering reuses `filterRowDetailSections` with the secondary side left out

`filterRowDetailSections` already accepts `searchQuery`/`fieldFilter` for the label and `primarySearchQuery`/`primaryValueFilter` for the value; the secondary and delta options are optional. The table passes the field and primary options only and `showDiffsOnly: false`. Single-run sections have `diffKind: Empty` and `secondaryRaw: null`, so no branch of the function needs to change. Filter state lives in the table component, which `ExecutionRowDetailPanel` keys by `resultId`, so selecting another row remounts it and resets collapse state and filters (the compare panel does the same with `rowSelectionId`).

### D4. Remove the legacy panel and what only it used

Deleted: `Details/RunMetricDetailPanel.tsx`; `AdaptiveValueGrid`, `AdaptiveValueRow`, `AdaptiveArrayValueContent`, `AdaptivePrimitiveValueContent`, `AdaptiveStructuredValueContent`, `AdaptiveValueTypeChip`; `ExecutionStatusBar`; `MetricGroup`, `MetricCardsGrid`, `Details/MetricCard`, `MetricInfoPanel`; `getDetailEntries`, `getMetricGroups`, `getPanelTitle`, `snapshotsToBindingsMap` in `View/utils.ts`, the `MetricGroup` type in `View/models.ts`; their specs. `ExtractionResult.tsx` stops calling `getMetricSnapshots` and `use-run-view-tab-state.ts` drops `snapshots`; `useDetailMode` drops its `metricBindings` parameter.

Each file is deleted only after a grep confirms no remaining non-spec importer — the survey found none, but `MetricCard` has same-named files elsewhere (`Common/MetricCard`, `Deployments/Common/MetricCard`) that must not be touched. `Common/CodeViewer` and `Common/FullscreenViewer` stay: the sessions-trace and MCP screens use them. The i18n keys `RunsI18nKey.Computed`, `RunsI18nKey.MetricBindings` and `EntitiesI18nKey.JSONViewer` are removed once nothing references them; `ExtractedColumns` and `TestCaseData` stay (the section labels use them). `getMetricSnapshots`, its action and API method stay, unreferenced by this tab: removing server plumbing is a separate decision from a UI change.

### D5. Specs

The new behaviour is a new capability, `run-result-row-details`, rather than additions to `run-compare-row-details` (which is about two runs) or `analytics-bottom-drawer` (which is the bottom position). `analytics-detail-view-switcher` is modified for the shared panel and header and for field focus in both modes; the requirements about the removed components are REMOVED from `progressive-depth-detail-panel`, `detail-panel-extracted-columns` and `analytics-metric-bindings-display`. Three of those main specs carry a stray `## ADDED Requirements` header in place of `## Requirements`, so archive would refuse them; the tasks repair the two that survive, and the third (`analytics-metric-bindings-display`, which loses every requirement) is deleted outright rather than through a delta.

## Risks / Trade-offs

- [Features dropped for good: JSON Viewer, Grafana trace link, per-metric info and bindings] → chosen explicitly; request and response bodies remain table fields, and the header is shared, so a later change can add a control for all positions at once.
- [Cross-folder imports from `Runs/Compare/...`] → they point at files this change does not edit; the direction (`Runs` feature code reusing the compare folder's row-detail pieces) already exists.
- [Mockup labels differ from the app: "Extracted" for the section, "ExecutionStatus"/"ExecutionDuration" for fields, Duration visible] → section and field labels and default visibility are what the bottom pivot uses today; the table inherits them rather than renaming them. If the design means a rename, that is a separate, app-wide label change.
- [A row-detail table with `max-h-[104px]` rows clips long extracted text] → intentional and identical to compare; the popup control gives the full value.
- [The legacy panel's `w-[750px]` becomes half the viewport] → matches the compare right panel, which the design shows.

## Migration Plan

Single release, no flags or data migration. Rollback is a revert.

## Open Questions

None that change the specs or the task breakdown.
