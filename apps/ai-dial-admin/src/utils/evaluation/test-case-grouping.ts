import { GridRowType, GroupedGridRow, TestCaseGroup, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseSchema, ValidationWarning } from '@/src/models/evaluation/test-suite';

export const getPerTurnFieldNames = (schema?: TestCaseSchema[] | null): Set<string> =>
  new Set((schema ?? []).filter((field) => field.perTurn).map((field) => field.name));

export const selectSharedFields = (
  data: Record<string, unknown> | undefined,
  perTurnFields: Set<string>,
): Record<string, unknown> => Object.fromEntries(Object.entries(data ?? {}).filter(([key]) => !perTurnFields.has(key)));

export const selectPerTurnFields = (
  data: Record<string, unknown> | undefined,
  perTurnFields: Set<string>,
): Record<string, unknown> => Object.fromEntries(Object.entries(data ?? {}).filter(([key]) => perTurnFields.has(key)));

/**
 * Accepts a numeric string as well as a number because inline cell editors can yield either,
 * and treats `0` as present — it is the first turn, not a missing index.
 */
export const readTurnIndex = (row: TestCaseRow): number | null => {
  const value = row._turnIndex;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }
  return null;
};

export const readGroupKey = (row: TestCaseRow): string | null => {
  if (readTurnIndex(row) === null) return null;
  const id = row.id;
  return typeof id === 'string' && id !== '' ? id : null;
};

const sortTurns = (turns: TestCaseRow[]): TestCaseRow[] =>
  turns
    .map((turn, index) => ({ turn, index, turnIndex: readTurnIndex(turn) }))
    .sort((a, b) => {
      if (a.turnIndex === null && b.turnIndex === null) return a.index - b.index;
      if (a.turnIndex === null) return 1;
      if (b.turnIndex === null) return -1;
      return a.turnIndex - b.turnIndex;
    })
    .map(({ turn }) => turn);

export const groupTestCaseRows = (rows: TestCaseRow[]): TestCaseGroup[] => {
  const groups: TestCaseGroup[] = [];
  const groupsByKey = new Map<string, TestCaseGroup>();

  rows.forEach((row) => {
    const groupKey = readGroupKey(row);

    if (groupKey === null) {
      groups.push({
        key: String(row.id),
        isMulti: false,
        testCaseName: row.testCaseName as string | undefined,
        turns: [row],
      });
      return;
    }

    const existing = groupsByKey.get(groupKey);
    if (existing) {
      existing.turns.push(row);
      return;
    }

    const group: TestCaseGroup = {
      key: groupKey,
      isMulti: true,
      testCaseName: row.testCaseName as string | undefined,
      turns: [row],
    };
    groupsByKey.set(groupKey, group);
    groups.push(group);
  });

  groupsByKey.forEach((group) => {
    group.turns = sortTurns(group.turns);
    group.testCaseName = group.turns[0]?.testCaseName as string | undefined;
  });

  return groups;
};

export const renumberTurns = (turns: TestCaseRow[]): TestCaseRow[] =>
  turns.map((turn, index) => ({ ...turn, _turnIndex: index }));

export const promoteToMultiTurn = (singleRow: TestCaseRow): TestCaseRow => ({ ...singleRow, _turnIndex: 0 });

export const demoteToSingle = (turnRow: TestCaseRow): TestCaseRow => {
  const rest = { ...turnRow };
  delete rest._turnIndex;
  return rest;
};

export const reorderTurns = (turns: TestCaseRow[], from: number, to: number): TestCaseRow[] => {
  if (from < 0 || from >= turns.length || to < 0 || to >= turns.length || from === to) {
    return renumberTurns(turns);
  }
  const next = [...turns];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return renumberTurns(next);
};

export const aggregateValidity = (
  turns: TestCaseRow[],
): { valid: boolean; validationWarnings: ValidationWarning[] } => ({
  valid: turns.every((turn) => turn.valid !== false),
  validationWarnings: turns.flatMap((turn) => (turn.validationWarnings as ValidationWarning[] | undefined) ?? []),
});

const toSingleRow = (group: TestCaseGroup): GroupedGridRow => {
  const turn = group.turns[0];
  return { ...turn, id: String(turn.id), rowType: GridRowType.SINGLE, groupKey: group.key };
};

const toTurnRow = (group: TestCaseGroup, turn: TestCaseRow, index: number): GroupedGridRow => ({
  ...turn,
  id: String(turn.id),
  rowType: GridRowType.TURN,
  groupKey: group.key,
  turnNumber: index + 1,
  // Carried on the turn row itself so a row action can tell a boundary turn from a middle one
  // without walking the grid — which would see only the rendered nodes, and so would misjudge the
  // boundary while a filter hides sibling turns.
  turnCount: group.turns.length,
});

const toGroupRow = (group: TestCaseGroup, expanded: boolean): GroupedGridRow => ({
  id: group.key,
  rowType: GridRowType.GROUP,
  groupKey: group.key,
  testCaseName: group.testCaseName,
  turns: group.turns,
  turnCount: group.turns.length,
  expanded,
  enabled: group.turns[0]?.enabled,
  // Shared fields are identical across turns, so reading `data` off turn 0 is what lets
  // shared-field columns render and edit on the master row.
  data: (group.turns[0]?.data as Record<string, unknown> | undefined) ?? {},
  ...aggregateValidity(group.turns),
});

/**
 * While searching, group summary rows are dropped and every turn is emitted individually so
 * ag-grid's native per-column filtering can hide non-matching turns.
 */
export const projectGroupsToGridRows = (
  groups: TestCaseGroup[],
  expandedKeys: Set<string>,
  isSearching: boolean,
): GroupedGridRow[] => {
  const rows: GroupedGridRow[] = [];

  groups.forEach((group) => {
    if (!group.isMulti) {
      rows.push(toSingleRow(group));
      return;
    }

    if (isSearching) {
      group.turns.forEach((turn, index) => rows.push(toTurnRow(group, turn, index)));
      return;
    }

    const expanded = expandedKeys.has(group.key);
    rows.push(toGroupRow(group, expanded));
    if (expanded) {
      group.turns.forEach((turn, index) => rows.push(toTurnRow(group, turn, index)));
    }
  });

  return rows;
};
