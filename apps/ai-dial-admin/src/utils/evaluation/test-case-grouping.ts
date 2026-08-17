import { CollapsibleTestCase, GroupedGridRow, TestCaseGroup } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseSchema, ValidationWarning } from '@/src/models/evaluation/test-suite';
import { GridRowType } from '@/src/types/grid-row-type';
import { TestCaseRow } from '@/src/types/test-case-row';

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

export const expandTestCasesToRows = <T extends CollapsibleTestCase = CollapsibleTestCase>(
  testCases?: T[] | null,
  schema?: TestCaseSchema[] | null,
): TestCaseRow[] => {
  // No schema means it has not loaded yet, so both maps merge unfiltered. An empty schema is a loaded
  // one that scopes nothing per turn, and does filter.
  const perTurnFields = schema ? getPerTurnFieldNames(schema) : void 0;

  return (testCases ?? []).flatMap(({ multiTurnData, data, ...rest }) => {
    if (!multiTurnData?.length) {
      return [{ ...rest, data: data ?? {}, ...(data ?? {}) }];
    }

    return multiTurnData.map((turn, index) => {
      const merged = perTurnFields
        ? { ...selectSharedFields(data, perTurnFields), ...selectPerTurnFields(turn, perTurnFields) }
        : { ...(data ?? {}), ...turn };
      return { ...rest, _turnIndex: index, data: merged, ...merged };
    });
  });
};

export const collapseRowsToCases = <T extends CollapsibleTestCase>(
  rows: TestCaseRow[],
  perTurnFields: Set<string>,
  buildCase: (row: TestCaseRow) => T,
): T[] => {
  const groups = new Map<string, TestCaseRow[]>();

  rows.forEach((row) => {
    const id = String(row.id);
    const group = groups.get(id);
    if (group) {
      group.push(row);
    } else {
      groups.set(id, [row]);
    }
  });

  return Array.from(groups.values()).map((groupRows) => {
    const base = groupRows[0];
    const testCase: T = { ...buildCase(base), data: (base.data as Record<string, unknown> | undefined) ?? {} };

    if (!groupRows.some((row) => readTurnIndex(row) !== null)) {
      return testCase;
    }

    const sorted = [...groupRows].sort((a, b) => (readTurnIndex(a) ?? 0) - (readTurnIndex(b) ?? 0));
    testCase.data = selectSharedFields(sorted[0].data as Record<string, unknown> | undefined, perTurnFields);
    testCase.multiTurnData = sorted.map((row) =>
      selectPerTurnFields(row.data as Record<string, unknown> | undefined, perTurnFields),
    );

    return testCase;
  });
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

const getWarningKey = ({ code, path, fieldName, message }: ValidationWarning): string =>
  JSON.stringify([code, path, fieldName, message]);

// Every turn row of a case carries a copy of the same case-level warnings, so concatenating them
// would repeat each warning once per turn.
const dedupeWarnings = (warnings: ValidationWarning[]): ValidationWarning[] => {
  const seen = new Set<string>();

  return warnings.filter((warning) => {
    const key = getWarningKey(warning);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const aggregateValidity = (
  turns: TestCaseRow[],
): { valid: boolean; validationWarnings: ValidationWarning[] } => ({
  valid: turns.every((turn) => turn.valid !== false),
  validationWarnings: dedupeWarnings(
    turns.flatMap((turn) => (turn.validationWarnings as ValidationWarning[] | undefined) ?? []),
  ),
});

const toSingleRow = (group: TestCaseGroup): GroupedGridRow => {
  const turn = group.turns[0];
  return { ...turn, id: String(turn.id), rowType: GridRowType.SINGLE, groupKey: group.key };
};

const toTurnRow = (group: TestCaseGroup, turn: TestCaseRow, index: number, isFlattened: boolean): GroupedGridRow => ({
  ...turn,
  id: String(turn.id),
  rowType: GridRowType.TURN,
  groupKey: group.key,
  turnNumber: index + 1,
  turnCount: group.turns.length,
  testCaseName: group.testCaseName,
  isFlattened,
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
  data: (group.turns[0]?.data as Record<string, unknown> | undefined) ?? {},
  ...aggregateValidity(group.turns),
});

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
      group.turns.forEach((turn, index) => rows.push(toTurnRow(group, turn, index, true)));
      return;
    }

    const expanded = expandedKeys.has(group.key);
    rows.push(toGroupRow(group, expanded));
    if (expanded) {
      group.turns.forEach((turn, index) => rows.push(toTurnRow(group, turn, index, false)));
    }
  });

  return rows;
};
