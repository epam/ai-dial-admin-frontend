import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { readTurnIndex, selectPerTurnFields, selectSharedFields } from '@/src/utils/evaluation/test-case-grouping';
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

const flatten = (data?: Record<string, unknown> | null): Record<string, unknown> =>
  Object.keys(data ?? {}).reduce((acc: Record<string, unknown>, key) => {
    acc[key] = data?.[key];
    return acc;
  }, {});

export const getDatasetTestCaseGridData = (testCases?: DatasetTestCase[] | null) => {
  return (
    testCases?.reduce((acc: Record<string, unknown>[], testCase: DatasetTestCase) => {
      const { multiTurnData, data, ...rest } = testCase;

      if (multiTurnData && multiTurnData.length > 0) {
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

export const collapseRowsToDatasetTestCases = (
  rows: Record<string, unknown>[],
  perTurnFields: Set<string> = new Set(),
): DatasetTestCase[] => {
  const groups = new Map<string, Record<string, unknown>[]>();

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
    const isMultiTurn = groupRows.some((row) => readTurnIndex(row) !== null);
    const base = groupRows[0];

    const testCase: DatasetTestCase = {
      id: base.id as string,
      testCaseName: base.testCaseName as string | undefined,
      createdAt: base.createdAt as number,
      updatedAt: base.updatedAt as number | undefined,
      valid: base.valid as boolean | undefined,
      validationWarnings: base.validationWarnings as DatasetTestCase['validationWarnings'],
      data: (base.data as Record<string, unknown> | undefined) ?? {},
    };

    if (!isMultiTurn) {
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
