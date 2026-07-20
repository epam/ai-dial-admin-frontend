## Why

Test-suite run results are shown one flat row per turn in the Extraction/Analytics results grid
(`Runs/View/ExtractionResult.tsx`). A multi-turn conversation therefore spreads across several rows
that are only kept adjacent by a default multi-sort, with per-turn `turnIndex`/`Total turns` columns
the user must read to reconstruct the conversation. This mirrors the pre-grouping test-case grids we
already fixed. Now that the backend adds a top-level `multiTurnId` to each result row, the UI can
fold a conversation's turns into one collapsible unit — reusing the primitive built for the
test-case grids.

## What Changes

- **Backend (out of scope here, dependency):** each result row (`AnalyticsResult`/`ResultDto`) gains
  a nullable top-level `multiTurnId` equal to the source test case's grouping key. Both-null/absent
  ⇒ single-turn result. No other results-payload change.
- **Reuse the grouping primitive.** Results group flat rows by `multiTurnId` using the existing pure
  `groupTestCaseRows` / `projectGroupsToGridRows` and the `TurnExpanderCellRenderer` /
  `StackedTurnsCellRenderer` / `TestCaseNameCellRenderer`. The read-only projection state is
  extracted into a shared hook so no CRUD logic is duplicated.
- **Read-only, expanded by default.** Results have no add/delete/reorder/edit. Multi-turn
  conversations render **expanded** by default (turn rows visible), collapsible to a summary row via
  a leading expander chevron. Single-turn results render as one row with no chevron.
- **Collapsed summary** stacks each column's per-turn values (read-only, auto-height); the name
  column shows the test-case/conversation name with an `N turns` badge.
- **Expand on search** — any active floating column filter flattens to per-turn rows so native
  filtering hides non-matching turns (same behavior as the test-case grids).
- **Sorting disabled while grouped.** ag-grid community cannot keep a conversation's turns contiguous
  under a synthesized summary row during a sort (mutating `postSortRows` node order is not honored in
  this grid), so column sorting is turned off in grouped mode; row order is owned by the projection.
- **Detail drawer / row click** stays keyed by result `id`: turn and single rows open their result
  detail; the synthesized GROUP summary row does not.
- **Graceful fallback:** when `multiTurnId` is absent on every row (backend not yet deployed), the
  grid behaves exactly as today — every row is a single-turn row, no groups, no expander effect.

## Capabilities

### New Capabilities

- `multi-turn-results-grouping`: UI-side grouping of flat test-case run-result rows into collapsible,
  expanded-by-default multi-turn conversations in the run results grid. Covers grouping by
  `multiTurnId`, the expander + rowType-aware name column, stacked summary rendering, expand-on-search,
  group-only sorting, and detail-drawer/row-click behavior for turn vs group rows.

### Modified Capabilities

- `multi-turn-test-case-ui-grouping`: the pure projection (`projectGroupsToGridRows`) gains an
  optional `defaultExpanded` flag and its read-only state is extracted into a shared
  `useTurnGroupProjection` hook. The test-case grids' behavior is unchanged (default collapsed).
