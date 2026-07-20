import { GridRowType, GroupedGridRow, TestCaseGroup, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';
import { ValidationWarning } from '@/src/models/evaluation/test-suite';

/** Read a row's top-level `multiTurnId` as a non-empty trimmed string, or null when absent. */
export const readMultiTurnId = (row: TestCaseRow): string | null => {
  const raw = row.multiTurnId;
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : null;
};

/**
 * Read a row's top-level `turnIndex` as a finite integer, or null when absent. Accepts a number or
 * numeric string (CSV import and inline editors can yield strings); `0` is a valid present value.
 */
export const readTurnIndex = (row: TestCaseRow): number | null => {
  const raw = row.turnIndex;
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.trunc(raw) : null;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
};

/** Sort turns by `turnIndex` ascending; rows without a turn index keep their relative order and go last. */
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
 * Group flat backend rows into logical test cases. Rows sharing a non-empty `multiTurnId` form
 * one multi-turn case (turns sorted by `turnIndex`); a row without a `multiTurnId` is a
 * single-turn case. Case order follows first appearance in the input.
 */
export const groupTestCaseRows = (rows: TestCaseRow[]): TestCaseGroup[] => {
  const multi = new Map<string, TestCaseRow[]>();
  const singleByKey = new Map<string, TestCaseRow>();
  const order: string[] = [];

  rows.forEach((row) => {
    const cid = readMultiTurnId(row);
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

/** Return turns with `turnIndex` renumbered to contiguous positions `0..n-1`. */
export const renumberTurns = (turns: TestCaseRow[]): TestCaseRow[] =>
  turns.map((turn, index) => ({ ...turn, turnIndex: index }));

/**
 * Promote a single-turn row to the first turn of a multi-turn case: attach the given
 * (caller-generated) `multiTurnId` and set `turnIndex` to 0. Pure — the caller owns id generation.
 */
export const promoteToMultiTurn = (singleRow: TestCaseRow, multiTurnId: string): TestCaseRow => ({
  ...singleRow,
  multiTurnId,
  turnIndex: 0,
});

/** Demote a turn back to a single-turn case by stripping the multi-turn grouping keys. */
export const demoteToSingle = (turnRow: TestCaseRow): TestCaseRow => ({
  ...turnRow,
  multiTurnId: null,
  turnIndex: null,
});

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
 * - Otherwise, multi-turn cases render as a collapsed GROUP row, expanded into TURN rows when their
 *   key is in `expandedKeys`; single-turn cases render as one SINGLE row.
 */
export const projectGroupsToGridRows = (
  groups: TestCaseGroup[],
  expandedKeys: Set<string>,
  isSearching: boolean,
): GroupedGridRow[] => {
  if (isSearching) {
    return groups.flatMap((group) =>
      group.isMulti ? group.turns.map((turn, index) => toTurnRow(group, turn, index)) : [toSingleRow(group)],
    );
  }

  const out: GroupedGridRow[] = [];
  groups.forEach((group) => {
    if (!group.isMulti) {
      out.push(toSingleRow(group));
      return;
    }
    const expanded = expandedKeys.has(group.key);
    out.push(toGroupRow(group, expanded));
    if (expanded) {
      group.turns.forEach((turn, index) => out.push(toTurnRow(group, turn, index)));
    }
  });
  return out;
};
