import { GroupedGridRow, TestCaseGroup } from '@/src/models/evaluation/test-case-grouping';
import { TestCase, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { GridRowType } from '@/src/types/grid-row-type';
import {
  getPerTurnFieldNames,
  selectPerTurnFields,
  selectSharedFields,
} from '@/src/utils/evaluation/test-case-grouping';

/** Rebuild a TestCase (with multiTurnData) from the Test Cases grid row used to open Try Out. */
export const testCaseFromTryOutRow = (
  row: GroupedGridRow | undefined,
  groups: TestCaseGroup[],
  schema?: TestCaseSchema[],
): TestCase | null => {
  if (!row?.id) {
    return null;
  }

  const perTurn = getPerTurnFieldNames(schema);
  const group =
    row.rowType === GridRowType.GROUP && row.turns?.length
      ? { key: row.id, isMulti: (row.turns?.length ?? 0) > 1, turns: row.turns }
      : groups.find((g) => g.key === row.groupKey || g.key === row.id);

  if (group?.isMulti && group.turns.length > 1) {
    return {
      id: String(group.key),
      createdAt: (group.turns[0]?.createdAt as number) ?? 0,
      data: selectSharedFields(group.turns[0]?.data as Record<string, unknown> | undefined, perTurn),
      multiTurnData: group.turns.map((turn) =>
        selectPerTurnFields(turn.data as Record<string, unknown> | undefined, perTurn),
      ),
    };
  }

  return {
    id: String(row.id),
    createdAt: (row.createdAt as number) ?? 0,
    data: (row.data as Record<string, unknown>) ?? {},
  };
};
