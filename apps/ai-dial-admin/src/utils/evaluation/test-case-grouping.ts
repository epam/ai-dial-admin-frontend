import { GridRowType, GroupedGridRow, TestCaseGroup, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';
import { ValidationWarning } from '@/src/models/evaluation/test-suite';

/**
 * Group key for a multi-turn turn row. Prefers an explicit client-only `_groupKey` when present — set
 * by callers (e.g. the results grid) that need the row's own `id` to stay the real underlying entity id
 * rather than doubling as the shared conversation key. Otherwise falls back to the shared case `id`: a
 * row is a multi-turn turn iff it carries a client-only `_turnIndex` (set at load when expanding a
 * `multiTurnData` case). Returns null for single-turn rows (no `_groupKey`, no `_turnIndex`), which are
 * grouped individually by their own id.
 */
export const readGroupKey = (row: TestCaseRow): string | null => {
  const explicit = row._groupKey;
  if (typeof explicit === 'string' && explicit.trim() !== '') return explicit;
  if (readTurnIndex(row) === null) return null;
  const id = row.id;
  return typeof id === 'string' && id.trim() !== '' ? id : null;
};

/**
 * Read a row's client-only `_turnIndex` as a finite integer, or null when absent. Accepts a number or
 * numeric string (CSV import and inline editors can yield strings); `0` is a valid present value.
 */
export const readTurnIndex = (row: TestCaseRow): number | null => {
  const raw = row._turnIndex;
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.trunc(raw) : null;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
};

/** Sort turns by `_turnIndex` ascending; rows without a turn index keep their relative order and go last. */
const sortTurns = (turns: TestCaseRow[]): TestCaseRow[] =>
  [...turns].sort((a, b) => {
    const ai = readTurnIndex(a);
    const bi = readTurnIndex(b);
    if (ai === null && bi === null) return 0;
    if (ai === null) return 1;
    if (bi === null) return -1;
    return ai - bi;
  });

/**
 * Group flat rows into logical test cases. Rows sharing an `id` and carrying `_turnIndex` form
 * one multi-turn case (turns sorted by `_turnIndex`); a row without `_turnIndex` is a
 * single-turn case. Case order follows first appearance in the input.
 */
export const groupTestCaseRows = (rows: TestCaseRow[]): TestCaseGroup[] => {
  const multi = new Map<string, TestCaseRow[]>();
  const singleByKey = new Map<string, TestCaseRow>();
  const order: string[] = [];

  rows.forEach((row) => {
    const cid = readGroupKey(row);
    if (cid) {
      if (!multi.has(cid)) {
        multi.set(cid, []);
        order.push(cid);
      }
      multi.get(cid)!.push(row);
    } else {
      const key = `single:${String(row.id ?? order.length)}`;
      singleByKey.set(key, row);
      order.push(key);
    }
  });

  return order.map((key) => {
    if (multi.has(key)) {
      const turns = sortTurns(multi.get(key)!);
      return { key, isMulti: true, testCaseName: turns[0]?.testCaseName as string | undefined, turns };
    }
    const row = singleByKey.get(key)!;
    return {
      key: String(row.id ?? key),
      isMulti: false,
      testCaseName: row.testCaseName as string | undefined,
      turns: [row],
    };
  });
};

/** Return turns with `_turnIndex` renumbered to contiguous positions `0..n-1`. */
export const renumberTurns = (turns: TestCaseRow[]): TestCaseRow[] =>
  turns.map((turn, index) => ({ ...turn, _turnIndex: index }));

/**
 * Promote a single-turn row to the first turn of a multi-turn case: set the client-only `_turnIndex`
 * to 0. The group key derives from the row's existing `id` — no separate id argument is needed. The
 * second parameter is kept for signature stability with callers still passing a (now-ignored) id.
 */
export const promoteToMultiTurn = (singleRow: TestCaseRow, _unused?: string): TestCaseRow => ({
  ...singleRow,
  _turnIndex: 0,
});

/** Demote a turn back to a single-turn case by stripping the client-only `_turnIndex`. */
export const demoteToSingle = (turnRow: TestCaseRow): TestCaseRow => {
  const { _turnIndex: __turnIndex, ...rest } = turnRow;
  return rest;
};

/** Move a turn from one position to another and renumber the result. */
export const reorderTurns = (turns: TestCaseRow[], from: number, to: number): TestCaseRow[] => {
  if (from === to || from < 0 || to < 0 || from >= turns.length || to >= turns.length) {
    return renumberTurns(turns);
  }
  const next = [...turns];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return renumberTurns(next);
};

/** Aggregate validity across a case's turns: valid only when every turn is valid; warnings concatenated. */
export const aggregateValidity = (
  turns: TestCaseRow[],
): { valid: boolean; validationWarnings: ValidationWarning[] } => {
  const valid = turns.every((turn) => turn.valid !== false);
  const validationWarnings = turns.flatMap(
    (turn) => (turn.validationWarnings as ValidationWarning[] | undefined) ?? [],
  );
  return { valid, validationWarnings };
};

const toSingleRow = (group: TestCaseGroup): GroupedGridRow => {
  const row = group.turns[0];
  return { ...row, id: String(row.id), rowType: GridRowType.SINGLE, groupKey: group.key };
};

const toGroupRow = (group: TestCaseGroup, expanded: boolean): GroupedGridRow => ({
  id: group.key,
  rowType: GridRowType.GROUP,
  groupKey: group.key,
  testCaseName: group.testCaseName,
  turns: group.turns,
  turnCount: group.turns.length,
  expanded,
  ...aggregateValidity(group.turns),
});

const toTurnRow = (group: TestCaseGroup, turn: TestCaseRow, index: number): GroupedGridRow => ({
  ...turn,
  id: String(turn.id),
  rowType: GridRowType.TURN,
  groupKey: group.key,
  turnNumber: index + 1,
  // Keep the turn's own `testCaseName` (from `...turn`) so the grid can show the underlying name
  // alongside the `Turn N` label, and edits/saves persist against the correct row name.
});

/**
 * Project grouped cases into a flat list of grid rows.
 * - When searching, group summary rows are dropped and every turn is emitted as an editable row
 *   (TURN for multi-turn cases, SINGLE for single-turn), so native per-column filtering can hide
 *   non-matching turns.
 * - Otherwise, multi-turn cases render as a GROUP summary row, expanded into TURN rows when open;
 *   single-turn cases render as one SINGLE row.
 *
 * `toggledKeys` holds the keys the user has toggled away from the default. With `defaultExpanded`
 * false (test-case grids, collapsed by default) it lists the *expanded* groups; with `defaultExpanded`
 * true (results grid, expanded by default) it lists the *collapsed* groups. Either way a group is
 * open when `defaultExpanded XOR toggledKeys.has(key)`.
 *
 * `singlesFirst` (results grid) stable-partitions single-turn cases ahead of multi-turn conversations
 * so the flat single results stack at the top; within each partition, first-appearance order is kept.
 */
export const projectGroupsToGridRows = (
  groups: TestCaseGroup[],
  toggledKeys: Set<string>,
  isSearching: boolean,
  defaultExpanded = false,
  singlesFirst = false,
): GroupedGridRow[] => {
  const orderedGroups = singlesFirst
    ? [...groups.filter((group) => !group.isMulti), ...groups.filter((group) => group.isMulti)]
    : groups;

  if (isSearching) {
    return orderedGroups.flatMap((group) =>
      group.isMulti ? group.turns.map((turn, index) => toTurnRow(group, turn, index)) : [toSingleRow(group)],
    );
  }

  const out: GroupedGridRow[] = [];
  orderedGroups.forEach((group) => {
    if (!group.isMulti) {
      out.push(toSingleRow(group));
      return;
    }
    const expanded = defaultExpanded ? !toggledKeys.has(group.key) : toggledKeys.has(group.key);
    out.push(toGroupRow(group, expanded));
    if (expanded) {
      group.turns.forEach((turn, index) => out.push(toTurnRow(group, turn, index)));
    }
  });
  return out;
};

/**
 * Re-glue a post-sort row list so each GROUP summary row is immediately followed by its own TURN
 * rows (in `turnNumber` order), and conversations appear in the order their summary row landed after
 * the sort. TURN rows scattered by the sort are pulled back under their GROUP; TURN rows whose GROUP
 * is not present (e.g. flat/search mode with no group rows) keep their sorted position. GROUP and
 * SINGLE rows keep their sorted order. Used as ag-grid's `postSortRows` callback so column sorting
 * reorders whole conversations without breaking turn grouping (community-safe — no row grouping).
 */
export const regroupSortedRows = (rows: GroupedGridRow[]): GroupedGridRow[] => {
  const groupRowByKey = new Map<string, GroupedGridRow>();
  const turnsByGroup = new Map<string, GroupedGridRow[]>();
  rows.forEach((row) => {
    if (row.rowType === GridRowType.GROUP) {
      groupRowByKey.set(row.groupKey, row);
    } else if (row.rowType === GridRowType.TURN) {
      const bucket = turnsByGroup.get(row.groupKey) ?? [];
      bucket.push(row);
      turnsByGroup.set(row.groupKey, bucket);
    }
  });
  if (groupRowByKey.size === 0) return rows;
  turnsByGroup.forEach((bucket) => bucket.sort((a, b) => (a.turnNumber ?? 0) - (b.turnNumber ?? 0)));

  // Emit each conversation at the position of its first-encountered member in the sorted list — the
  // summary row, or (since summary rows tie on the sorted value) its first sorted turn. This makes a
  // column sort reorder whole conversations while turns stay `turnNumber`-ordered beneath.
  const emitted = new Set<string>();
  const out: GroupedGridRow[] = [];
  const emitGroup = (key: string, groupRow: GroupedGridRow) => {
    emitted.add(key);
    out.push(groupRow);
    out.push(...(turnsByGroup.get(key) ?? []));
  };
  rows.forEach((row) => {
    if (row.rowType === GridRowType.GROUP) {
      if (!emitted.has(row.groupKey)) emitGroup(row.groupKey, row);
      return;
    }
    if (row.rowType === GridRowType.TURN) {
      const groupRow = groupRowByKey.get(row.groupKey);
      if (!groupRow) {
        out.push(row); // no summary row present (flat/search mode) — keep the turn in place
      } else if (!emitted.has(row.groupKey)) {
        emitGroup(row.groupKey, groupRow);
      }
      return;
    }
    out.push(row); // SINGLE
  });
  return out;
};
