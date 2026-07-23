/**
 * Domain types for UI-side grouping of flat test-case rows into collapsible multi-turn cases.
 * Storage stays an array of test cases; a turn row is identified by sharing its case `id` with the
 * other turns and carrying a client-only, never-persisted `_turnIndex`. These types describe only
 * how the grid groups and renders those rows.
 */

/** The kind of row rendered in a grouped test-case grid. */
export enum GridRowType {
  /** Collapsed multi-turn summary row (carries all its turns for stacked rendering). */
  GROUP = 'GROUP',
  /** One editable turn of a multi-turn case (present only when its group is expanded). */
  TURN = 'TURN',
  /** A single-turn case rendered as one editable row. */
  SINGLE = 'SINGLE',
}

/**
 * A flat test-case row as held by the grid (case `id` + optional client-only `_turnIndex` + nested
 * `data`). May also carry an optional client-only `_groupKey`: an explicit grouping override used when
 * the row's own `id` must stay the real underlying entity id (e.g. results grid, where `id` must remain
 * usable to fetch/select that entity's detail) instead of doubling as the shared conversation key.
 */
export type TestCaseRow = Record<string, unknown>;

/** One logical test case grouped from flat rows. */
export interface TestCaseGroup {
  /** Shared case `id` for a multi-turn case; the row id for a single-turn case. */
  key: string;
  /** True when the rows share an `id` and carry `_turnIndex` (rendered as a collapsible group). */
  isMulti: boolean;
  testCaseName?: string;
  /** Turns ordered by `_turnIndex`. */
  turns: TestCaseRow[];
}

/**
 * A row as projected into the grid. For TURN/SINGLE rows the backend row fields are spread in
 * (so existing schema value-getters that read `data.data[field]` keep working); GROUP rows are
 * synthetic and carry the aggregated `turns`.
 */
export interface GroupedGridRow extends TestCaseRow {
  /** Stable, unique grid row id: shared case id for GROUP, row id for TURN/SINGLE. */
  id: string;
  rowType: GridRowType;
  /** Shared case id for multi-turn rows; row id for single-turn rows. */
  groupKey: string;
  /** GROUP only: number of turns. */
  turnCount?: number;
  /** GROUP only: whether the group is expanded (drives the chevron + turn visibility). */
  expanded?: boolean;
  /** GROUP only: all turns, ordered, for stacked summary rendering. */
  turns?: TestCaseRow[];
  /** TURN only: 1-based turn position for display. */
  turnNumber?: number;
}
