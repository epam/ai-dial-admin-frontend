import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { selectPerTurnFields, selectSharedFields } from '@/src/utils/evaluation/test-case-grouping';
import { v4 as uuidv4 } from 'uuid';

export const createNewDatasetTestCaseRow = (): Record<string, unknown> => {
  return {
    id: uuidv4(),
    testCaseName: `new-test-case-${uuidv4().slice(0, 5)}`,
    data: {},
    createdAt: 0,
    updatedAt: 0,
  };
};

const flatten = (data?: Record<string, unknown>): Record<string, unknown> =>
  Object.keys(data || {}).reduce((acc: Record<string, unknown>, key) => {
    acc[key] = data?.[key];
    return acc;
  }, {});

export const getDatasetTestCaseGridData = (testCases?: DatasetTestCase[] | null) => {
  return (
    testCases?.reduce((acc: Record<string, unknown>[], testCase: DatasetTestCase) => {
      const { multiTurnData, data, ...rest } = testCase;
      if (multiTurnData && multiTurnData.length > 0) {
        // Each turn row carries the merged view (shared `data` + that turn's per-turn map), matching
        // execution's per-turn resolution. Columns decide what to actually show per scope.
        const shared = data ?? {};
        multiTurnData.forEach((turn, index) => {
          const merged = { ...shared, ...turn };
          acc.push({ ...rest, id: testCase.id, _turnIndex: index, data: merged, ...flatten(merged) });
        });
      } else {
        acc.push({ ...rest, data: data ?? {}, ...flatten(data) });
      }
      return acc;
    }, []) || []
  );
};

export const collapseRowsToDatasetTestCases = (
  rows: Record<string, unknown>[],
  perTurnFields: Set<string> = new Set(),
): DatasetTestCase[] => {
  const byId = new Map<string, Record<string, unknown>[]>();
  const order: string[] = [];
  rows.forEach((row) => {
    const id = row.id as string;
    if (!byId.has(id)) {
      byId.set(id, []);
      order.push(id);
    }
    byId.get(id)!.push(row);
  });

  return order.map((id) => {
    const group = byId.get(id)!;
    const first = group[0];
    const base: DatasetTestCase = {
      id,
      testCaseName: first.testCaseName as string | undefined,
      createdAt: first.createdAt as number,
      updatedAt: first.updatedAt as number | undefined,
      valid: first.valid as boolean | undefined,
      validationWarnings: first.validationWarnings as DatasetTestCase['validationWarnings'],
    };
    const isMulti = group.some((r) => r._turnIndex != null);
    if (isMulti) {
      const sorted = [...group].sort((a, b) => (a._turnIndex as number) - (b._turnIndex as number));
      // Split the merged per-turn rows back into shared `data` (constant across turns, read off the
      // first turn) and per-turn `multiTurnData`, per the schema's `perTurn` flags.
      return {
        ...base,
        data: selectSharedFields(sorted[0].data as Record<string, unknown>, perTurnFields),
        multiTurnData: sorted.map((r) => selectPerTurnFields(r.data as Record<string, unknown>, perTurnFields)),
      };
    }
    return { ...base, data: first.data as Record<string, unknown> };
  });
};

export const rowToDatasetTestCase = (row: Record<string, unknown>): DatasetTestCase => {
  return {
    id: row.id as string,
    testCaseName: row.testCaseName as string | undefined,
    createdAt: row.createdAt as number,
    updatedAt: row.updatedAt as number | undefined,
    valid: row.valid as boolean | undefined,
    validationWarnings: row.validationWarnings as DatasetTestCase['validationWarnings'],
    data: row.data as Record<string, unknown>,
  };
};
